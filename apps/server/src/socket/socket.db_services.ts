import { prisma } from "../db.ts";
import type { Conversation, ConversationRead, Message, User } from "../db.ts";
import { ADMIN_EMAIL_SET } from "../config/config.ts";

export type { Conversation, ConversationRead, Message, User };

// minimal conversation shape with participant ids for authorisation
export type ConversationParticipants = {
    id: string;
    isAdminThread: boolean;
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
                isAdminThread: true,
                studentId: true,
                recruiterId: true,
                student: { select: { deletedAt: true } },
                recruiter: { select: { deletedAt: true } },
            },
        });
    }

    static async getAdminUserIds(): Promise<string[]> {
        const adminEmails = Array.from(ADMIN_EMAIL_SET);
        const [byRole, byEmail] = await Promise.all([
            prisma.user.findMany({
                where: { role: "ADMIN" },
                select: { id: true },
            }),
            adminEmails.length > 0
                ? prisma.user.findMany({
                      where: { email: { in: adminEmails } },
                      select: { id: true },
                  })
                : Promise.resolve([] as { id: string }[]),
        ]);
        const ids = new Set([...byRole, ...byEmail].map((r) => r.id));
        return Array.from(ids);
    }

    // Returns true if userId shares a company with recruiterId (team member access)
    static async isCompanyCoMember(
        userId: string,
        recruiterId: string,
    ): Promise<boolean> {
        const shared = await prisma.companyMember.findFirst({
            where: {
                userId,
                company: { members: { some: { userId: recruiterId } } },
            },
        });
        return !!shared;
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

    // Minimal shape for authorising an edit: who sent it, where it lives, and when it was sent.
    static getMessageForEdit(messageId: string): Promise<{
        id: string;
        conversationId: string;
        senderId: string;
        createdAt: Date;
    } | null> {
        return prisma.message.findUnique({
            where: { id: messageId },
            select: {
                id: true,
                conversationId: true,
                senderId: true,
                createdAt: true,
            },
        });
    }

    static updateMessageBody(
        messageId: string,
        body: string,
        editedAt: Date,
    ): Promise<Message> {
        return prisma.message.update({
            where: { id: messageId },
            data: { body, editedAt },
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
        const [rows, adminIds] = await Promise.all([
            prisma.conversation.findMany({
                where: {
                    OR: [{ studentId: userId }, { recruiterId: userId }],
                },
                select: {
                    studentId: true,
                    recruiterId: true,
                    isAdminThread: true,
                },
            }),
            // if this user has an admin thread, all admins are their peers
            prisma.conversation
                .findFirst({
                    where: { studentId: userId, isAdminThread: true },
                    select: { id: true },
                })
                .then((found) =>
                    found ? SocketDbService.getAdminUserIds() : [],
                ),
        ]);
        const peers = new Set<string>();
        for (const r of rows) {
            // skip self-referential admin thread slots
            if (r.studentId !== userId && !r.isAdminThread)
                peers.add(r.studentId);
            if (r.recruiterId !== userId && !r.isAdminThread)
                peers.add(r.recruiterId);
        }
        for (const id of adminIds) peers.add(id);
        return Array.from(peers);
    }
}
