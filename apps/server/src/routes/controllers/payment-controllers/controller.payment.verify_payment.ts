import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { config } from "../../../config/config.ts";
import { PLANS, isPlanCode } from "../../../core/plans.ts";
import { NotificationType, PaymentStatus, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    planCode: z.string().min(1).refine(isPlanCode, "Unknown plan"),
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
});

export default async function verifyPayment(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!config.SERVER_RAZORPAY_SECRET) {
            throw new ApiError("Payment gateway not configured.", {
                status: 500,
                code: "INTERNAL_SERVER_ERROR",
            });
        }
        const body = Body.parse(req.body);
        const userId = req.user!.id;

        const expected = createHmac("sha256", config.SERVER_RAZORPAY_SECRET)
            .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
            .digest("hex");
        const expectedBuf = Buffer.from(expected, "hex");
        const actualBuf = Buffer.from(body.razorpay_signature, "hex");
        const signatureOk =
            expectedBuf.length === actualBuf.length &&
            timingSafeEqual(expectedBuf, actualBuf);

        if (!signatureOk) {
            try {
                await prisma.payment.updateMany({
                    where: {
                        razorpayOrderId: body.razorpay_order_id,
                        userId,
                        status: PaymentStatus.CREATED,
                    },
                    data: { status: PaymentStatus.FAILED },
                });
            } catch (err) {
                console.error("could not mark payment failed:", err);
            }
            throw new InvalidRequest("Invalid payment signature");
        }

        const plan = PLANS[body.planCode]!;
        const now = new Date();
        const premiumUntil = new Date(
            now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
        );

        await prisma.$transaction([
            prisma.payment.updateMany({
                where: { razorpayOrderId: body.razorpay_order_id, userId },
                data: {
                    status: PaymentStatus.SUCCESS,
                    razorpayPaymentId: body.razorpay_payment_id,
                    razorpaySignature: body.razorpay_signature,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    isPremium: true,
                    premiumSince: now,
                    premiumUntil,
                    activePlanCode: plan.code,
                },
            }),
        ]);

        console.log(
            `[payment] ✅ Payment verified — user=${userId} plan=${plan.code} amount=₹${plan.amount / 100} validUntil=${premiumUntil.toISOString()}`,
        );

        await notify({
            userId,
            type: NotificationType.SUBSCRIPTION_ACTIVATED,
            title: `Welcome to ${plan.name}`,
            body: "Your upgrade is active. Enjoy unlimited applications, priority support, and mentor sessions.",
            link: "/home",
        });

        api.ok({ ok: true, planCode: plan.code });
    } catch (err) {
        handleApiError(err, api);
    }
}
