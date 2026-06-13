import { prisma } from "../db.ts";
import { isSupportAgentEnabled } from "../config/config.ts";
import { ensureSupportAgentUser } from "./support-agent.ts";
import { SocketDbService } from "../socket/socket.db_services.ts";
import { manager } from "../socket/socket.connection_manager.ts";
import { MESSAGE_TYPE } from "types";

// Role-specific welcome copy. Sent once, from the "Support Team" account, into
// the user's admin/support thread the moment they confirm their role during
// onboarding. Tweak the wording here.
const WELCOME_BODY: Record<"STUDENT" | "EMPLOYER", string> = {
    STUDENT: [
        "👋 Welcome to SpiderSkill!",
        "",
        "A few quick tips:",
        "✅ Complete your profile to 100% before applying, complete profiles are more likely to receive interview opportunities.",
        "✅ Apply to multiple internships that match your interests and skills.",
        "✅ Keep your profile and resume updated.",
        "✅ Enable Auto-Apply button",
        "",
        "💬 Have a question or need help? Just reply to this chat and we will assist you.",
    ].join("\n"),
    EMPLOYER: [
        "👋 Welcome to SpiderSkill!",
        "",
        "A few quick tips:",
        "✅ You have 1 free internship post available (expires in 3 days).",
        "✅ Complete your company profile with as much detail as possible to attract more students.",
        "✅ Add clear role descriptions, responsibilities, and requirements to improve application quality.",
        "",
        "💬 Have a question or need help? Just reply to this chat and we will assist you.",
    ].join("\n"),
};

export async function sendWelcomeMessage(
    userId: string,
    role: "STUDENT" | "EMPLOYER",
): Promise<void> {
    try {
        if (!isSupportAgentEnabled) return;

        const support = await ensureSupportAgentUser();

        // Reuse the start_admin_conversation upsert: an admin thread is a
        // Conversation where studentId === recruiterId === the user's id.
        const conversation = await prisma.conversation.upsert({
            where: {
                studentId_recruiterId: {
                    studentId: userId,
                    recruiterId: userId,
                },
            },
            create: {
                studentId: userId,
                recruiterId: userId,
                isAdminThread: true,
            },
            update: {},
            select: { id: true },
        });

        const msg = await SocketDbService.createMessage(
            conversation.id,
            support.id,
            WELCOME_BODY[role],
        );
        await SocketDbService.touchConversationLastMessageAt(
            conversation.id,
            msg.createdAt,
        );

        // Push it live to the user (and any connected admins) so it shows up
        // immediately and bumps the unread badge, mirroring socket sends.
        const adminIds = await SocketDbService.getAdminUserIds();
        const recipients = [userId, ...adminIds].filter(
            (id, i, arr) => arr.indexOf(id) === i,
        );
        manager.sendToUsers(recipients, {
            type: MESSAGE_TYPE.MESSAGE_CREATED,
            message: {
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                body: msg.body,
                createdAt: msg.createdAt.toISOString(),
                editedAt: msg.editedAt?.toISOString() ?? null,
            },
        });
    } catch (err) {
        // Onboarding must succeed even if the welcome message fails.
        console.error("Failed to send welcome message", { userId, role, err });
    }
}
