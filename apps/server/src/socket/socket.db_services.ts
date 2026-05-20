import { Prisma, prisma } from "../db.ts";
import type { CompanyMember, Conversation, Message, User } from "../db.ts";

type ConversationWithListing = Prisma.ConversationGetPayload<{
    include: { application: { include: { listing: true } } };
}>;

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
    ): Promise<Pick<CompanyMember, "userId">[]> {
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
