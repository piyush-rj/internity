import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { PLANS } from "../../../core/plans.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    code: z.string().min(1),
});

function discountAmount(original: number, pct: number): number {
    return Math.round(original * (1 - pct / 100));
}

export default async function validateCoupon(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const { code } = Body.parse(req.body);
        const now = new Date();

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.trim().toUpperCase() },
            include: {
                redemptions: {
                    where: { userId },
                    take: 1,
                },
            },
        });

        if (!coupon) {
            api.fail(404, "INVALID_COUPON", "Coupon code not found.");
            return;
        }
        if (!coupon.isActive) {
            api.fail(400, "COUPON_REVOKED", "This coupon has been revoked.");
            return;
        }
        if (coupon.expiresAt < now) {
            api.fail(400, "COUPON_EXPIRED", "This coupon has expired.");
            return;
        }
        if (coupon.redemptions.length > 0) {
            api.fail(400, "ALREADY_USED", "You have already used this coupon.");
            return;
        }

        api.ok({
            valid: true,
            code: coupon.code,
            discounts: {
                PER_POST: {
                    pct: coupon.discountPctPerPost,
                    originalAmount: PLANS.PER_POST!.amount,
                    discountedAmount: discountAmount(
                        PLANS.PER_POST!.amount,
                        coupon.discountPctPerPost,
                    ),
                },
                MONTHLY: {
                    pct: coupon.discountPctMonthly,
                    originalAmount: PLANS.MONTHLY!.amount,
                    discountedAmount: discountAmount(
                        PLANS.MONTHLY!.amount,
                        coupon.discountPctMonthly,
                    ),
                },
                YEARLY: {
                    pct: coupon.discountPctYearly,
                    originalAmount: PLANS.YEARLY!.amount,
                    discountedAmount: discountAmount(
                        PLANS.YEARLY!.amount,
                        coupon.discountPctYearly,
                    ),
                },
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
