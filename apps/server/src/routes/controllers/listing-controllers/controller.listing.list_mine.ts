import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listMyListings(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const memberships = await prisma.companyMember.findMany({
            where: { userId: req.user!.id },
            select: { companyId: true },
        });
        if (memberships.length === 0) {
            api.ok({ items: [] });
            return;
        }
        const companyIds = memberships.map((m) => m.companyId);

        const rows = await prisma.listing.findMany({
            where: { companyId: { in: companyIds } },
            orderBy: { createdAt: "desc" },
            include: {
                company: {
                    select: { id: true, name: true, slug: true, logoUrl: true },
                },
                _count: { select: { applications: true } },
            },
        });

        const listingIds = rows.map((r) => r.id);
        const seenCounts =
            listingIds.length > 0
                ? await prisma.application.groupBy({
                      by: ["listingId"],
                      where: {
                          listingId: { in: listingIds },
                          seenAt: { not: null },
                      },
                      _count: { _all: true },
                  })
                : [];
        const seenMap = new Map(
            seenCounts.map((c) => [c.listingId, c._count._all]),
        );

        const items = rows.map((l) => {
            const { _count, ...rest } = l;
            return {
                ...rest,
                _count: {
                    applications: _count.applications,
                    applicationsSeen: seenMap.get(l.id) ?? 0,
                },
            };
        });
        api.ok({ items });
    } catch (err) {
        handleApiError(err, api);
    }
}
