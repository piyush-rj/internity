import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { deleteObject } from "../../../core/storage.ts";
import { prisma } from "../../../db.ts";

export default async function removeUpload(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const a = await prisma.asset.findUnique({
            where: { id: req.params.asset_id as string },
        });
        if (!a || a.userId !== req.user!.id) throw new NotFound();
        await deleteObject(a.key);
        await prisma.asset.delete({ where: { id: a.id } });
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
