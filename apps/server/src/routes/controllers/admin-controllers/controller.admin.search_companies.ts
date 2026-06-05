import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    q: z.string().min(1).max(100),
});

export default async function searchCompanies(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { q } = Query.parse(req.query);

        const companies = await prisma.company.findMany({
            where: {
                name: { contains: q, mode: "insensitive" },
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                verificationStatus: true,
                isPremium: true,
                freeListingUsed: true,
                freePostingGrants: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        grantedPostings: true,
                        usedPostings: true,
                    },
                },
            },
            orderBy: { name: "asc" },
            take: 10,
        });

        api.ok({ companies });
    } catch (err) {
        handleApiError(err, api);
    }
}
