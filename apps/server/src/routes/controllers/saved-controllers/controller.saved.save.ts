import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function save(req: Request, res: Response): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const listingId = req.params.listing_id as string;
        const saved = await prisma.savedListing.upsert({
            where: { userId_listingId: { userId, listingId } },
            create: { userId, listingId },
            update: {},
        });
        api.ok({
            saved: {
                userId: saved.userId,
                listingId: saved.listingId,
                createdAt: saved.createdAt,
            },
        });
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
