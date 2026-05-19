import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listMessages(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const conv = await prisma.conversation.findUnique({
            where: { id: req.params.conversation_id as string },
            include: { application: { include: { listing: true } } },
        });
        if (!conv) throw new NotFound();

        // Participants = student on the application + company members.
        const members = await prisma.companyMember.findMany({
            where: { companyId: conv.application.listing.companyId },
            select: { userId: true },
        });
        const participants = new Set<string>([
            conv.application.studentId,
            ...members.map((m) => m.userId),
        ]);
        if (!participants.has(req.user!.id)) {
            throw new Forbidden("Not a participant in this conversation");
        }

        const limitRaw = Number(req.query.limit);
        const limit =
            Number.isFinite(limitRaw) && limitRaw > 0
                ? Math.min(limitRaw, 100)
                : 50;
        const beforeRaw = req.query.before;
        const before = typeof beforeRaw === "string" ? new Date(beforeRaw) : null;

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
