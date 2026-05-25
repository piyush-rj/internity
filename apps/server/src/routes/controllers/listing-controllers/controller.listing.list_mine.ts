import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
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

        const items = rows.map((l) => {
            const { _count, ...rest } = l;
            return { ...rest, _count: { applications: _count.applications } };
        });
        api.ok({ items });
    } catch (err) {
        handleApiError(err, api);
    }
}
