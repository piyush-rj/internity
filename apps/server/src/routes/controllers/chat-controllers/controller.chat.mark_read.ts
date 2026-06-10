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
        select: {
            id: true,
            studentId: true,
            recruiterId: true,
            isAdminThread: true,
        },
    });
    if (!conv) throw new NotFound("Conversation not found");

    const isAdmin = req.user!.role === "ADMIN";
    const isParticipant =
        conv.studentId === userId || conv.recruiterId === userId;

    let canAccess = isParticipant || (isAdmin && conv.isAdminThread);
    if (!canAccess && !conv.isAdminThread) {
        const shared = await prisma.companyMember.findFirst({
            where: {
                userId,
                company: {
                    members: { some: { userId: conv.recruiterId } },
                },
            },
        });
        canAccess = !!shared;
    }
    if (!canAccess) throw new Forbidden("Not a participant");

    const now = new Date();
    await prisma.conversationRead.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId, lastReadAt: now },
        update: { lastReadAt: now },
    });

    // Admin threads broadcast to the non-admin participant + all admins
    let participants: string[];
    if (conv.isAdminThread) {
        const adminIds = await prisma.user
            .findMany({ where: { role: "ADMIN" }, select: { id: true } })
            .then((rows) => rows.map((r) => r.id));
        participants = [conv.studentId, ...adminIds].filter(
            (id, i, arr) => arr.indexOf(id) === i,
        );
    } else {
        participants =
            conv.studentId === conv.recruiterId
                ? [conv.studentId]
                : [conv.studentId, conv.recruiterId];
    }

    manager.sendToUsers(participants, {
        type: MESSAGE_TYPE.CONVERSATION_READ,
        conversationId,
        readerId: userId,
        readAt: now.toISOString(),
    });

    api.ok({ readAt: now.toISOString() });
}
