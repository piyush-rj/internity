import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getActiveOffer(
    _req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const now = new Date();

        // Return the most recently created active, non-expired offer.
        const offer = await prisma.offer.findFirst({
            where: { isActive: true, expiresAt: { gt: now } },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                discountPctPerPost: true,
                discountPctMonthly: true,
                discountPctYearly: true,
                expiresAt: true,
            },
        });

        api.ok({ offer: offer ?? null });
    } catch (err) {
        handleApiError(err, api);
    }
}
