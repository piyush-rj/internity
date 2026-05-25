import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listMessages(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const conv = await prisma.conversation.findUnique({
            where: { id: req.params.conversation_id as string },
            select: { id: true, studentId: true, recruiterId: true },
        });
        if (!conv) throw new NotFound();

        // 1:1 thread — only the two ids on the row are participants.
        if (
            conv.studentId !== req.user!.id &&
            conv.recruiterId !== req.user!.id
        ) {
            throw new Forbidden("Not a participant in this conversation");
        }

        const limitRaw = Number(req.query.limit);
        const limit =
            Number.isFinite(limitRaw) && limitRaw > 0
                ? Math.min(limitRaw, 100)
                : 50;
        const beforeRaw = req.query.before;
        const before =
            typeof beforeRaw === "string" ? new Date(beforeRaw) : null;

        const rows = await prisma.message.findMany({
            where: {
                conversationId: conv.id,
                ...(before && !Number.isNaN(before.getTime())
                    ? { createdAt: { lt: before } }
                    : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        api.ok(
            rows.map((m) => ({
                id: m.id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                body: m.body,
                createdAt: m.createdAt.toISOString(),
            })),
        );
    } catch (err) {
        handleApiError(err, api);
    }
}
