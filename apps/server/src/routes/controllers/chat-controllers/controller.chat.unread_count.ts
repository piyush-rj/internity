import type { Request, Response } from "express";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * Total unread message count across every conversation the caller is part of.
 * Drives the sidebar badge — kept as a single integer so the client doesn't
 * have to keep the full conversation list hot.
 */
export default async function unreadCount(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [{ studentId: userId }, { recruiterId: userId }],
        },
        select: {
            id: true,
            reads: {
                where: { userId },
                select: { lastReadAt: true },
            },
        },
    });

    const counts = await Promise.all(
        conversations.map((c) => {
            const lastRead = c.reads[0]?.lastReadAt ?? null;
            return prisma.message.count({
                where: {
                    conversationId: c.id,
                    senderId: { not: userId },
                    ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
                },
            });
        }),
    );

    const count = counts.reduce((sum, n) => sum + n, 0);
    api.ok({ count });
}
