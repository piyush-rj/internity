import type { Request, Response } from "express";
import type { Prisma } from "../../../db.ts";
import {
    ResponseWriter,
    handleApiError,
    Forbidden,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// GET /listing/mine — listings the caller can manage.
//   scope=mine     → only listings the caller posted (postedById === me)
//   scope=company  → every listing under the resolved company set (default)
//   companyId=<id> → pin to one company (membership verified); omitted falls
//                    back to all companies the caller belongs to.
export default async function listMyListings(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const scope = req.query.scope === "mine" ? "mine" : "company";
        const companyId =
            typeof req.query.companyId === "string"
                ? req.query.companyId
                : undefined;

        let companyIds: string[];
        if (companyId) {
            const member = await prisma.companyMember.findUnique({
                where: { companyId_userId: { companyId, userId } },
                select: { companyId: true },
            });
            if (!member) throw new Forbidden("Not a member of this company");
            companyIds = [companyId];
        } else {
            const memberships = await prisma.companyMember.findMany({
                where: { userId },
                select: { companyId: true },
            });
            companyIds = memberships.map((m) => m.companyId);
        }
        if (companyIds.length === 0) {
            api.ok({ items: [] });
            return;
        }

        const where: Prisma.ListingWhereInput = {
            companyId: { in: companyIds },
            ...(scope === "mine" ? { postedById: userId } : {}),
        };

        const rows = await prisma.listing.findMany({
            where,
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
