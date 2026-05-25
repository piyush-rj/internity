import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { config } from "../../../config/config.ts";
import { PLANS, isPlanCode } from "../../../core/plans.ts";
import { PaymentStatus, prisma } from "../../../db.ts";

const Body = z.object({
    planCode: z.string().min(1).refine(isPlanCode, "Unknown plan"),
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
        const plan = PLANS[body.planCode]!;
        const userId = req.user!.id;

        const client = new Razorpay({
            key_id: config.SERVER_RAZORPAY_ID,
            key_secret: config.SERVER_RAZORPAY_SECRET,
        });
        const receipt = `r_${userId.slice(-8)}_${Date.now().toString(16)}`;
        const order = await client.orders.create({
            amount: plan.amount,
            currency: plan.currency,
            receipt,
            notes: { userId, planCode: plan.code },
        });

        await prisma.payment.create({
            data: {
                userId,
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
