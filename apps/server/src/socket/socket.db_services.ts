import { Prisma, prisma } from "../db.ts";
import type {
    CompanyMember,
    Conversation,
    ConversationRead,
    Message,
    User,
} from "../db.ts";

export type { CompanyMember, Conversation, ConversationRead, Message, User };

export type ConversationWithListing = Prisma.ConversationGetPayload<{
    include: { application: { include: { listing: true } } };
}>;

export type CompanyMemberUserId = Pick<CompanyMember, "userId">;

export class SocketDbService {

    static getConversationWithListing(
        conversationId: string,
    ): Promise<ConversationWithListing | null> {
        return prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { application: { include: { listing: true } } },
        });
    }

    static getCompanyMemberUserIds(
        companyId: string,
    ): Promise<CompanyMemberUserId[]> {
        return prisma.companyMember.findMany({
            where: { companyId },
            select: { userId: true },
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

    static async getReadsForUser(
        userId: string,
        conversationIds: string[],
    ): Promise<Map<string, Date>> {
        if (conversationIds.length === 0) return new Map();
        const rows = await prisma.conversationRead.findMany({
            where: { userId, conversationId: { in: conversationIds } },
            select: { conversationId: true, lastReadAt: true },
        });
        return new Map(rows.map((r) => [r.conversationId, r.lastReadAt]));
    }

    static countUnread(
        conversationId: string,
        viewerId: string,
        lastReadAt: Date | null,
    ): Promise<number> {
        return prisma.message.count({
            where: {
                conversationId,
                senderId: { not: viewerId },
                ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            },
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
}
