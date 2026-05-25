import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listSaved(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const rows = await prisma.savedListing.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: "desc" },
            include: {
                listing: {
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                logoUrl: true,
                            },
                        },
                    },
                },
            },
        });
        api.ok({ items: rows });
    } catch (err) {
        handleApiError(err, api);
    }
}
