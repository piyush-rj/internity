import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export default async function listCoupons(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);

        const [total, items] = await Promise.all([
            prisma.coupon.count(),
            prisma.coupon.findMany({
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true },
                    },
                    _count: { select: { redemptions: true } },
                },
            }),
        ]);

        // Batch-fetch revoking users so we can show who revoked each coupon.
        const revokedByIds = [
            ...new Set(
                items
                    .map((c) => c.revokedById)
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

        const now = new Date();
        api.ok({
            items: items.map((c) => ({
                id: c.id,
                code: c.code,
                discountPctPerPost: c.discountPctPerPost,
                discountPctMonthly: c.discountPctMonthly,
                discountPctYearly: c.discountPctYearly,
                isActive: c.isActive,
                isExpired: c.expiresAt < now,
                revokedAt: c.revokedAt?.toISOString() ?? null,
                revokedBy: c.revokedById
                    ? (revokedUserMap.get(c.revokedById) ?? null)
                    : null,
                expiresAt: c.expiresAt.toISOString(),
                createdAt: c.createdAt.toISOString(),
                createdBy: c.createdBy,
                redemptionCount: c._count.redemptions,
            })),
            total,
            page: q.page,
            pageSize: q.pageSize,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
