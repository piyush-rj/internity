import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function deleteDraft(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const result = await prisma.listingDraft.deleteMany({
            where: { id: req.params.id, userId: req.user!.id },
        });
        if (result.count === 0) throw new NotFound("Draft not found");
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
