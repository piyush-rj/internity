import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { manager } from "../../../socket/socket.connection_manager.ts";
import { MESSAGE_TYPE } from "types";

// marks the conversation read for the caller and broadcasts to participants
export default async function markConversationRead(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const userId = req.user!.id;
    const conversationId = req.params.conversation_id as string;

    const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, studentId: true, recruiterId: true },
    });
    if (!conv) throw new NotFound("Conversation not found");

    if (conv.studentId !== userId && conv.recruiterId !== userId) {
        throw new Forbidden("Not a participant");
    }

    const now = new Date();
    await prisma.conversationRead.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId, lastReadAt: now },
        update: { lastReadAt: now },
    });

    const participants =
        conv.studentId === conv.recruiterId
            ? [conv.studentId]
            : [conv.studentId, conv.recruiterId];
    manager.sendToUsers(participants, {
        type: MESSAGE_TYPE.CONVERSATION_READ,
        conversationId,
        readerId: userId,
        readAt: now.toISOString(),
    });

    api.ok({ readAt: now.toISOString() });
}
