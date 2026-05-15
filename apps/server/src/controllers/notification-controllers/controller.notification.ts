import type { Request, Response } from "express";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default class NotificationController {
    // GET /notification — list latest notifications for current user
    static async list_mine(req: Request, res: Response) {
        const userId = req.user!.id;
        const rawLimit = Number(req.query.limit);
        const limit =
            Number.isFinite(rawLimit) && rawLimit > 0
                ? Math.min(rawLimit, MAX_LIMIT)
                : DEFAULT_LIMIT;
        try {
            const [items, unread] = await Promise.all([
                prisma.notification.findMany({
                    where: { userId },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                }),
                prisma.notification.count({
                    where: { userId, readAt: null },
                }),
            ]);
            ResponseWriter.success(res, { items, unread });
        } catch (err) {
            console.error("notification.list_mine:", err);
            ResponseWriter.server_error(res);
        }
    }

    // PATCH /notification/:id/read
    static async mark_read(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const userId = req.user!.id;
        try {
            const existing = await prisma.notification.findUnique({
                where: { id },
                select: { userId: true, readAt: true },
            });
            if (!existing || existing.userId !== userId) {
                ResponseWriter.not_found(res);
                return;
            }
            const updated = existing.readAt
                ? existing
                : await prisma.notification.update({
                      where: { id },
                      data: { readAt: new Date() },
                  });
            ResponseWriter.success(res, { notification: updated });
        } catch (err) {
            console.error("notification.mark_read:", err);
            ResponseWriter.server_error(res);
        }
    }

    // POST /notification/read-all
    static async mark_all_read(req: Request, res: Response) {
        const userId = req.user!.id;
        try {
            const result = await prisma.notification.updateMany({
                where: { userId, readAt: null },
                data: { readAt: new Date() },
            });
            ResponseWriter.success(res, { updated: result.count });
        } catch (err) {
            console.error("notification.mark_all_read:", err);
            ResponseWriter.server_error(res);
        }
    }
}
