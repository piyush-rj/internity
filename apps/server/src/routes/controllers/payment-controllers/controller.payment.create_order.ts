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
    couponCode: z.string().optional(),
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

        // Determine the correct amount to charge. Priority:
        //   1. Coupon code (user-provided, validated against DB)
        //   2. Active promotional offer (auto-applied when no coupon)
        //   3. Full plan price
        let couponId: string | null = null;
        let offerId: string | null = null;
        let finalAmount = plan.amount;
        const now = new Date();

        if (body.couponCode) {
            // ── Coupon path ──────────────────────────────────────────────
            const coupon = await prisma.coupon.findUnique({
                where: { code: body.couponCode.trim().toUpperCase() },
                include: { redemptions: { where: { userId }, take: 1 } },
            });

            if (!coupon || !coupon.isActive || coupon.expiresAt < now) {
                api.fail(400, "INVALID_COUPON", "Invalid or expired coupon code.");
                return;
            }
            if (coupon.redemptions.length > 0) {
                api.fail(400, "ALREADY_USED", "You have already used this coupon.");
                return;
            }

            const pctMap: Record<string, number> = {
                PER_POST: coupon.discountPctPerPost,
                MONTHLY: coupon.discountPctMonthly,
                YEARLY: coupon.discountPctYearly,
            };
            const pct = pctMap[body.planCode] ?? 0;
            finalAmount = Math.round(plan.amount * (1 - pct / 100));
            couponId = coupon.id;
        } else {
            // ── Offer path: auto-apply if a live offer exists ─────────────
            const offer = await prisma.offer.findFirst({
                where: { isActive: true, expiresAt: { gt: now } },
                orderBy: { createdAt: "desc" },
            });

            if (offer) {
                const pctMap: Record<string, number> = {
                    PER_POST: offer.discountPctPerPost,
                    MONTHLY: offer.discountPctMonthly,
                    YEARLY: offer.discountPctYearly,
                };
                const pct = pctMap[body.planCode] ?? 0;
                finalAmount = Math.round(plan.amount * (1 - pct / 100));
                offerId = offer.id;
            }
        }

        const client = new Razorpay({
            key_id: config.SERVER_RAZORPAY_ID,
            key_secret: config.SERVER_RAZORPAY_SECRET,
        });
        const receipt = `r_${body.companyId.slice(-6)}_${Date.now().toString(16)}`;
        let order;
        try {
            order = await client.orders.create({
                amount: finalAmount,
                currency: plan.currency,
                receipt,
                notes: {
                    userId,
                    companyId: body.companyId,
                    planCode: plan.code,
                    ...(couponId ? { couponId } : {}),
                    ...(offerId ? { offerId } : {}),
                },
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
                // Store the discounted amount so verify_payment knows what was charged.
                amount: finalAmount,
                currency: plan.currency,
                razorpayOrderId: order.id,
                status: PaymentStatus.CREATED,
                ...(couponId ? { couponId } : {}),
                ...(offerId ? { offerId } : {}),
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
