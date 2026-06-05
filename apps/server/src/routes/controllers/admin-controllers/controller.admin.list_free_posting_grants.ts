import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export default async function listFreePostingGrants(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);

        const [total, items] = await Promise.all([
            prisma.freePostingGrant.count(),
            prisma.freePostingGrant.findMany({
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            logoUrl: true,
                        },
                    },
                    grantedBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        // Batch-fetch revoking users.
        const revokedByIds = [
            ...new Set(
                items
                    .map((g) => g.revokedById)
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
            items: items.map((g) => ({
                id: g.id,
                grantedPostings: g.grantedPostings,
                usedPostings: g.usedPostings,
                remainingPostings: Math.max(
                    0,
                    g.grantedPostings - g.usedPostings,
                ),
                note: g.note,
                isActive: g.isActive,
                revokedAt: g.revokedAt?.toISOString() ?? null,
                revokedBy: g.revokedById
                    ? (revokedUserMap.get(g.revokedById) ?? null)
                    : null,
                createdAt: g.createdAt.toISOString(),
                company: g.company,
                grantedBy: g.grantedBy,
            })),
            total,
            page: q.page,
            pageSize: q.pageSize,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
