import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listDrafts(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const items = await prisma.listingDraft.findMany({
            where: { userId: req.user!.id },
            orderBy: { updatedAt: "desc" },
        });
        api.ok({ items });
    } catch (err) {
        handleApiError(err, api);
    }
}
