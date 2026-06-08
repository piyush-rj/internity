import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getDraft(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const draft = await prisma.listingDraft.findFirst({
            where: { id: req.params.id, userId: req.user!.id },
        });
        if (!draft) throw new NotFound("Draft not found");
        api.ok({ draft });
    } catch (err) {
        handleApiError(err, api);
    }
}
