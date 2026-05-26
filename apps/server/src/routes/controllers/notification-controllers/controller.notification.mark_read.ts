import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function markNotificationRead(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const n = await prisma.notification.findUnique({ where: { id } });
        if (!n || n.userId !== req.user!.id) throw new NotFound();
        if (n.readAt === null) {
            const updated = await prisma.notification.update({
                where: { id },
                data: { readAt: new Date() },
            });
            api.ok({ notification: updated });
            return;
        }
        api.ok({ notification: n });
    } catch (err) {
        handleApiError(err, api);
    }
}
