import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";
import { notify } from "../../../services/notifications.ts";

/**
 * Turn any open team invites addressed to this user's email into in-app
 * notifications. Idempotent (skips invites that already have one), so it
 * safely back-fills invites created before the user signed up.
 */
async function syncPendingInviteNotifications(
    userId: string,
    email: string,
): Promise<void> {
    try {
        const pending = await prisma.companyInvitation.findMany({
            where: {
                email: { equals: email, mode: "insensitive" },
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { token: true, company: { select: { name: true } } },
        });
        if (pending.length === 0) return;

        const links = pending.map((p) => `/home/invite/${p.token}`);
        const existing = await prisma.notification.findMany({
            where: { userId, link: { in: links } },
            select: { link: true },
        });
        const notified = new Set(existing.map((n) => n.link));

        for (const inv of pending) {
            const link = `/home/invite/${inv.token}`;
            if (notified.has(link)) continue;
            await notify({
                userId,
                type: "COMPANY_INVITE",
                title: `You're invited to join ${inv.company.name}`,
                body: "Accept the invite to join the team.",
                link,
            });
        }
    } catch (err) {
        // Best-effort: never let invite reconciliation break /auth/me.
        console.error("syncPendingInviteNotifications failed:", err);
    }
}

export default async function getMe(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                studentProfile: {
                    select: {
                        id: true,
                        interestedJobTitles: true,
                        lastCoverLetter: true,
                    },
                },
                employerProfile: { select: { id: true } },
                companyMemberships: {
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                logoUrl: true,
                                verificationStatus: true,
                                // Premium lives on the company so any member
                                // gets the correct isPremium in their session.
                                isPremium: true,
                                premiumUntil: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: "asc" },
                },
            },
        });
        if (!user) {
            api.notFound();
            return;
        }

        if (user.email) {
            await syncPendingInviteNotifications(user.id, user.email);
        }

        api.ok({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: user.role,
            roleConfirmed: user.roleConfirmed,
            isAdmin: isAdminUser({ role: user.role, email: user.email }),
            // isPremium is the company's premium status for employer users.
            // Falls back to the user-level flag for legacy / student accounts.
            isPremium:
                user.companyMemberships[0]?.company.isPremium ??
                user.isPremium,
            premiumUntil:
                user.companyMemberships[0]?.company.premiumUntil?.toISOString() ??
                user.premiumUntil?.toISOString() ??
                null,
            needsOnboarding: !user.name || user.name.trim().length === 0,
            hasStudentProfile: user.studentProfile !== null,
            hasEmployerProfile: user.employerProfile !== null,
            interestedJobTitles: user.studentProfile?.interestedJobTitles ?? [],
            lastCoverLetter: user.studentProfile?.lastCoverLetter ?? null,
            activeCompanyId: user.activeCompanyId,
            companies: user.companyMemberships.map((m) => ({
                role: m.role,
                customRole: m.customRole,
                joinedAt: m.joinedAt,
                company: m.company,
            })),
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
