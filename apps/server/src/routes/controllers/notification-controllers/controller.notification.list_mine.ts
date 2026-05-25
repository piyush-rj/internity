import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default async function listMyNotifications(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const raw = Number(req.query.limit);
        const take =
            !Number.isFinite(raw) || raw <= 0
                ? DEFAULT_LIMIT
                : Math.min(raw, MAX_LIMIT);

        const [items, unread] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take,
            }),
            prisma.notification.count({ where: { userId, readAt: null } }),
        ]);
        api.ok({ items, unread });
    } catch (err) {
        handleApiError(err, api);
    }
}
