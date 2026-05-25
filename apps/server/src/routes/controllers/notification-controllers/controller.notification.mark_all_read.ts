import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function markAllNotificationsRead(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const result = await prisma.notification.updateMany({
            where: { userId: req.user!.id, readAt: null },
            data: { readAt: new Date() },
        });
        api.ok({ updated: result.count });
    } catch (err) {
        handleApiError(err, api);
    }
}
