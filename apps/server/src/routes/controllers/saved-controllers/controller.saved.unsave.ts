import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function unsave(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        await prisma.savedListing.deleteMany({
            where: {
                userId: req.user!.id,
                listingId: req.params.listing_id as string,
            },
        });
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
