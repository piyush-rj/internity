import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export default async function listOffers(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);
        const now = new Date();

        const [total, items] = await Promise.all([
            prisma.offer.count(),
            prisma.offer.findMany({
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        // Batch-fetch revoking users so we can show who revoked each offer.
        const revokedByIds = [
            ...new Set(
                items
                    .map((o) => o.revokedById)
                    .filter((id): id is string => id !== null),
            ),
        ];
        const revokedUsers =
            revokedByIds.length > 0
                ? await prisma.user.findMany({
                      where: { id: { in: revokedByIds } },
                      select: { id: true, name: true, email: true },
                  })
                : [];
        const revokedUserMap = new Map(revokedUsers.map((u) => [u.id, u]));

        api.ok({
            items: items.map((o) => ({
                id: o.id,
                title: o.title,
                description: o.description,
                discountPctPerPost: o.discountPctPerPost,
                discountPctMonthly: o.discountPctMonthly,
                discountPctYearly: o.discountPctYearly,
                isActive: o.isActive,
                isExpired: o.expiresAt < now,
                revokedAt: o.revokedAt?.toISOString() ?? null,
                revokedBy: o.revokedById
                    ? (revokedUserMap.get(o.revokedById) ?? null)
                    : null,
                expiresAt: o.expiresAt.toISOString(),
                createdAt: o.createdAt.toISOString(),
                createdBy: o.createdBy,
            })),
            total,
            page: q.page,
            pageSize: q.pageSize,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
