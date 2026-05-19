import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
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
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
