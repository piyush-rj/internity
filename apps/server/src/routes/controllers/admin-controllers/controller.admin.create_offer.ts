import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    defaultDiscountPct: z.number().int().min(1).max(99),
    discountPctPerPost: z.number().int().min(1).max(99).optional(),
    discountPctMonthly: z.number().int().min(1).max(99).optional(),
    discountPctYearly: z.number().int().min(1).max(99).optional(),
    expiresAt: z.string().optional(),
});

export default async function createOffer(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const adminId = req.user!.id;
        const d = body.defaultDiscountPct;

        const expiresAt = body.expiresAt
            ? new Date(body.expiresAt)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const offer = await prisma.offer.create({
            data: {
                title: body.title.trim(),
                description: body.description?.trim() ?? null,
                discountPctPerPost: body.discountPctPerPost ?? d,
                discountPctMonthly: body.discountPctMonthly ?? d,
                discountPctYearly: body.discountPctYearly ?? d,
                expiresAt,
                createdById: adminId,
            },
        });

        api.ok({ offer: { id: offer.id, title: offer.title } });
    } catch (err) {
        handleApiError(err, api);
    }
}
