import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getCompanyBySlug(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const c = await prisma.company.findUnique({
            where: { slug: req.params.slug as string },
        });
        if (!c) throw new NotFound();
        const listings = await prisma.listing.findMany({
            where: { companyId: c.id, closedAt: null },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { company: true },
        });
        api.ok({ company: { ...c, listings } });
    } catch (err) {
        handleApiError(err, api);
    }
}
