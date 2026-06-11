import { timingSafeEqual } from "node:crypto";
import { prisma } from "../db.ts";
import {
    config,
    isSupportAgentEnabled,
    SUPPORT_AGENT_EMAIL,
} from "../config/config.ts";

export type SupportAgentUser = {
    id: string;
    name: string | null;
    email: string | null;
};

// The support agent needs a real public.User row so its chat messages have a
// valid senderId FK and so getAdminUserIds() (role-based) routes support-thread
// messages to it. The row is role=ADMIN but has no supabaseUserId — it can only
// authenticate through the email/password support login.
let cached: SupportAgentUser | null = null;

// Idempotently creates/repairs the support-agent User row, keyed on its email.
export async function ensureSupportAgentUser(): Promise<SupportAgentUser> {
    if (!isSupportAgentEnabled) {
        throw new Error("Support agent is not configured");
    }
    if (cached) return cached;

    const user = await prisma.user.upsert({
        where: { email: SUPPORT_AGENT_EMAIL },
        // Keep it an admin and never soft-deleted; the email never changes.
        update: { role: "ADMIN", deletedAt: null },
        create: {
            email: SUPPORT_AGENT_EMAIL,
            name: "Support Team",
            role: "ADMIN",
            roleConfirmed: true,
        },
        select: { id: true, name: true, email: true },
    });

    cached = user;
    return user;
}

// Returns the support-agent row id, looking it up by id when present in a token.
export async function getSupportAgentById(
    id: string,
): Promise<SupportAgentUser | null> {
    if (cached && cached.id === id) return cached;
    const user = await prisma.user.findFirst({
        where: { id, email: SUPPORT_AGENT_EMAIL, deletedAt: null },
        select: { id: true, name: true, email: true },
    });
    if (user) cached = user;
    return user;
}

// Constant-time-ish credential check against the configured email/password.
export function checkSupportAgentCredentials(
    email: string,
    password: string,
): boolean {
    if (!isSupportAgentEnabled) return false;
    const emailMatches =
        email.trim().toLowerCase() === SUPPORT_AGENT_EMAIL.toLowerCase();
    const passwordMatches = safeEqual(password, config.SUPPORT_AGENT_PASSWORD);
    // Always evaluate both so the comparison cost doesn't leak which field was
    // wrong; the result is the AND of the two.
    return emailMatches && passwordMatches;
}

function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}
