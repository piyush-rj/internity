import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    code: z
        .string()
        .min(3)
        .max(20)
        .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and digits only."),
    // Default percentage — pre-fills all three plans.
    defaultDiscountPct: z.number().int().min(1).max(99),
    // Per-plan overrides (fall back to defaultDiscountPct if omitted).
    discountPctPerPost: z.number().int().min(1).max(99).optional(),
    discountPctMonthly: z.number().int().min(1).max(99).optional(),
    discountPctYearly: z.number().int().min(1).max(99).optional(),
    // Expiry: ISO string. Defaults to 30 days from now if omitted.
    expiresAt: z.string().datetime().optional(),
});

export default async function createCoupon(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const adminId = req.user!.id;

        const existing = await prisma.coupon.findUnique({
            where: { code: body.code },
        });
        if (existing) {
            api.fail(409, "DUPLICATE_CODE", `Coupon code "${body.code}" already exists.`);
            return;
        }

        const d = body.defaultDiscountPct;
        const expiresAt = body.expiresAt
            ? new Date(body.expiresAt)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const coupon = await prisma.coupon.create({
            data: {
                code: body.code,
                discountPctPerPost: body.discountPctPerPost ?? d,
                discountPctMonthly: body.discountPctMonthly ?? d,
                discountPctYearly: body.discountPctYearly ?? d,
                expiresAt,
                createdById: adminId,
            },
        });

        api.ok({ coupon: { id: coupon.id, code: coupon.code } });
    } catch (err) {
        handleApiError(err, api);
    }
}
