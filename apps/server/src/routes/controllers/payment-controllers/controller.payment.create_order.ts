import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { z } from "zod";
import {
    ApiError,
    Forbidden,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { config } from "../../../config/config.ts";
import { PLANS, isPlanCode } from "../../../core/plans.ts";
import { PaymentStatus, prisma } from "../../../db.ts";

const Body = z.object({
    planCode: z.string().min(1).refine(isPlanCode, "Unknown plan"),
    companyId: z.string().min(1),
});

function gatewayNotConfigured(): ApiError {
    return new ApiError(
        "Payment gateway not configured. Set SERVER_RAZORPAY_ID and SERVER_RAZORPAY_SECRET.",
        { status: 500, code: "INTERNAL_SERVER_ERROR" },
    );
}

export default async function createOrder(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!config.SERVER_RAZORPAY_ID || !config.SERVER_RAZORPAY_SECRET) {
            throw gatewayNotConfigured();
        }
        const body = Body.parse(req.body);
        const userId = req.user!.id;

        // Verify the caller is an active member of the company they're
        // purchasing for — any role can buy, only FOUNDER_OWNER can cancel.
        const membership = await prisma.companyMember.findFirst({
            where: { userId, companyId: body.companyId },
        });
        if (!membership) {
            throw new Forbidden("You are not a member of this company.");
        }

        const plan = PLANS[body.planCode]!;

        const client = new Razorpay({
            key_id: config.SERVER_RAZORPAY_ID,
            key_secret: config.SERVER_RAZORPAY_SECRET,
        });
        const receipt = `r_${body.companyId.slice(-6)}_${Date.now().toString(16)}`;
        let order;
        try {
            order = await client.orders.create({
                amount: plan.amount,
                currency: plan.currency,
                receipt,
                notes: { userId, companyId: body.companyId, planCode: plan.code },
            });
        } catch (razorpayErr) {
            console.error(
                "Razorpay order creation failed:",
                JSON.stringify(razorpayErr, null, 2),
            );
            throw razorpayErr;
        }

        await prisma.payment.create({
            data: {
                userId,
                companyId: body.companyId,
                planCode: plan.code,
                amount: plan.amount,
                currency: plan.currency,
                razorpayOrderId: order.id,
                status: PaymentStatus.CREATED,
            },
        });

        api.ok({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: config.SERVER_RAZORPAY_ID,
            planName: plan.name,
            planDescription: plan.description,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
