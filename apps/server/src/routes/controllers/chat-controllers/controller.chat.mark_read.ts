import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { manager } from "../../../socket/socket.connection_manager.ts";
import { MESSAGE_TYPE } from "types";

/**
 * Bumps the caller's `lastReadAt` for this conversation to now and broadcasts
 * a `conversation_read` to the rest of the participants so their sent-tick
 * indicators flip to "read".
 */
export default async function markConversationRead(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const userId = req.user!.id;
    const conversationId = req.params.conversation_id as string;

    const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { application: { include: { listing: true } } },
    });
    if (!conv) throw new NotFound("Conversation not found");

    const members = await prisma.companyMember.findMany({
        where: { companyId: conv.application.listing.companyId },
        select: { userId: true },
    });
    const participants = Array.from(
        new Set<string>([
            conv.application.studentId,
            ...members.map((m) => m.userId),
        ]),
    );
    if (!participants.includes(userId)) {
        throw new Forbidden("Not a participant");
    }

    const now = new Date();
    await prisma.conversationRead.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId, lastReadAt: now },
        update: { lastReadAt: now },
    });

    manager.sendToUsers(participants, {
        type: MESSAGE_TYPE.CONVERSATION_READ,
        conversationId,
        readerId: userId,
        readAt: now.toISOString(),
    });

    api.ok({ readAt: now.toISOString() });
}
