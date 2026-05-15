import crypto from "node:crypto";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import z from "zod";
import { prisma, PaymentStatus, NotificationType } from "database";
import { ENV } from "../../config/config.env";
import { PLANS, isPlanCode } from "../../lib/plans";
import { notify } from "../../services/service.notification";
import ResponseWriter from "../../class/response_writer";

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
    if (razorpayClient) return razorpayClient;
    if (!ENV.SERVER_RAZORPAY_ID || !ENV.SERVER_RAZORPAY_SECRET) return null;
    razorpayClient = new Razorpay({
        key_id: ENV.SERVER_RAZORPAY_ID,
        key_secret: ENV.SERVER_RAZORPAY_SECRET,
    });
    return razorpayClient;
}

export default class PaymentController {
    static order_schema = z.object({
        planCode: z.string().refine(isPlanCode, "Unknown plan"),
    });

    static verify_schema = z.object({
        planCode: z.string().refine(isPlanCode, "Unknown plan"),
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
    });

    static async create_order(req: Request, res: Response) {
        const razorpay = getRazorpay();
        if (!razorpay || !ENV.SERVER_RAZORPAY_ID) {
            ResponseWriter.server_error(
                res,
                "Payment gateway not configured. Set SERVER_RAZORPAY_ID and SERVER_RAZORPAY_SECRET.",
            );
            return;
        }
        const { data, success } = PaymentController.order_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        const plan = PLANS[data.planCode as keyof typeof PLANS];
        try {
            const order = await razorpay.orders.create({
                amount: plan.amount,
                currency: plan.currency,
                receipt: `r_${req.user!.id.slice(-8)}_${Date.now().toString(36)}`,
                notes: { userId: req.user!.id, planCode: plan.code },
            });
            await prisma.payment.create({
                data: {
                    userId: req.user!.id,
                    planCode: plan.code,
                    amount: plan.amount,
                    currency: plan.currency,
                    razorpayOrderId: order.id,
                    status: PaymentStatus.CREATED,
                },
            });
            ResponseWriter.success(res, {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: ENV.SERVER_RAZORPAY_ID,
                planName: plan.name,
                planDescription: plan.description,
            });
        } catch (err) {
            console.error("payment.create_order:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async verify(req: Request, res: Response) {
        if (!ENV.SERVER_RAZORPAY_SECRET) {
            ResponseWriter.server_error(res, "Payment gateway not configured.");
            return;
        }
        const { data, success } = PaymentController.verify_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        const expected = crypto
            .createHmac("sha256", ENV.SERVER_RAZORPAY_SECRET)
            .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
            .digest("hex");
        if (expected !== data.razorpay_signature) {
            await prisma.payment
                .updateMany({
                    where: {
                        razorpayOrderId: data.razorpay_order_id,
                        userId: req.user!.id,
                        status: PaymentStatus.CREATED,
                    },
                    data: { status: PaymentStatus.FAILED },
                })
                .catch(() => {});
            ResponseWriter.invalid_data(res, "Invalid payment signature");
            return;
        }

        const plan = PLANS[data.planCode as keyof typeof PLANS];
        try {
            await prisma.$transaction([
                prisma.payment.updateMany({
                    where: {
                        razorpayOrderId: data.razorpay_order_id,
                        userId: req.user!.id,
                    },
                    data: {
                        status: PaymentStatus.SUCCESS,
                        razorpayPaymentId: data.razorpay_payment_id,
                        razorpaySignature: data.razorpay_signature,
                    },
                }),
                prisma.user.update({
                    where: { id: req.user!.id },
                    data: { isPremium: true, premiumSince: new Date() },
                }),
            ]);
        } catch (err) {
            console.error("payment.verify persist:", err);
            ResponseWriter.server_error(res);
            return;
        }

        await notify({
            userId: req.user!.id,
            type: NotificationType.SUBSCRIPTION_ACTIVATED,
            title: `Welcome to ${plan.name}`,
            body: "Your upgrade is active. Enjoy unlimited applications, priority support, and mentor sessions.",
            link: "/home",
        });

        ResponseWriter.success(res, { ok: true, planCode: plan.code });
    }
}
