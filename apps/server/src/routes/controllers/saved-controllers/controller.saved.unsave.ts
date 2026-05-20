import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
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
