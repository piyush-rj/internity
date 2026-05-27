import { prisma } from "../db.ts";
import type { Conversation, ConversationRead, Message, User } from "../db.ts";

export type { Conversation, ConversationRead, Message, User };

// minimal conversation shape with participant ids for authorisation
export type ConversationParticipants = {
    id: string;
    studentId: string;
    recruiterId: string;
    student: { deletedAt: Date | null };
    recruiter: { deletedAt: Date | null };
};

export class SocketDbService {
    static getConversation(
        conversationId: string,
    ): Promise<ConversationParticipants | null> {
        return prisma.conversation.findUnique({
            where: { id: conversationId },
            select: {
                id: true,
                studentId: true,
                recruiterId: true,
                student: { select: { deletedAt: true } },
                recruiter: { select: { deletedAt: true } },
            },
        });
    }

    static createMessage(
        conversationId: string,
        senderId: string,
        body: string,
    ): Promise<Message> {
        return prisma.message.create({
            data: { conversationId, senderId, body },
        });
    }

    static touchConversationLastMessageAt(
        conversationId: string,
        at: Date,
    ): Promise<Conversation> {
        return prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: at },
        });
    }

    static markConversationRead(
        conversationId: string,
        userId: string,
        at: Date,
    ): Promise<ConversationRead> {
        return prisma.conversationRead.upsert({
            where: { conversationId_userId: { conversationId, userId } },
            create: { conversationId, userId, lastReadAt: at },
            update: { lastReadAt: at },
        });
    }

    static findUserBySupabaseId(supabaseUserId: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { supabaseUserId } });
    }

    static findUserByEmailOrPhone(
        email: string | null,
        phone: string | null,
    ): Promise<User | null> {
        return prisma.user.findFirst({
            where: {
                OR: [
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : []),
                ],
            },
        });
    }

    static linkSupabaseUserId(
        userId: string,
        supabaseUserId: string,
    ): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { supabaseUserId },
        });
    }

    static markUserOnline(userId: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { isOnline: true, lastSeenAt: null },
        });
    }

    static markUserOffline(userId: string, at: Date): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeenAt: at },
        });
    }

    // returns user ids that share a conversation with the given user
    static async getConversationPeerUserIds(userId: string): Promise<string[]> {
        const rows = await prisma.conversation.findMany({
            where: {
                OR: [{ studentId: userId }, { recruiterId: userId }],
            },
            select: { studentId: true, recruiterId: true },
        });
        const peers = new Set<string>();
        for (const r of rows) {
            if (r.studentId !== userId) peers.add(r.studentId);
            if (r.recruiterId !== userId) peers.add(r.recruiterId);
        }
        return Array.from(peers);
    }
}
