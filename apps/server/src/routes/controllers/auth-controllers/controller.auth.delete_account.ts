import type { Request, Response } from "express";
import {
    ApiError,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, NotificationType, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

// "Founder" seats for the sole-founder block. CO_FOUNDER counts: as long as
// at least one founder-level person stays behind, the company isn't orphaned.
const FOUNDER_ROLES: CompanyRole[] = [
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
];

// Surfaces to the frontend as a structured 409 so the settings page can
// render a friendly dialog listing the affected companies.
class SoleOwnerBlocked extends ApiError {
    readonly companies: { id: string; name: string; slug: string }[];
    constructor(companies: { id: string; name: string; slug: string }[]) {
        const names = companies.map((c) => c.name).join(", ");
        super(
            `You're the only owner of ${names}. Transfer ownership to a teammate or close the company before deleting your account.`,
            { status: 409, code: "SOLE_OWNER" },
        );
        this.companies = companies;
    }
}

// Soft-delete the signed-in user's account. The row stays for audit, but
// every connecting thread (Supabase identity, email/phone uniqueness,
// team memberships, pending invites they sent, OAuth tokens) is severed
// so the user vanishes from every surface and a re-sign-in lands them in
// the new-user flow.
//
// Listings posted by the user are deliberately preserved as-is — they
// belong to the company, not the individual. The remaining owners keep
// posting and visibility. Applications / interviews / messages are also
// preserved; the counter-party will see "Deleted account" instead of the
// user's identity.
export default async function deleteMyAccount(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const now = new Date();

        const me = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, deletedAt: true },
        });
        // Idempotent — already deleted is a no-op success so retries from a
        // flaky network don't surface as errors.
        if (!me || me.deletedAt) {
            api.ok({ ok: true }, "Account deleted");
            return;
        }

        // Sole-owner pre-check. A multi-owner company can absorb the loss;
        // a solo company would be left orphaned, so the user has to make a
        // choice (transfer or close) before deletion can proceed.
        const ownedCompanies = await prisma.companyMember.findMany({
            where: { userId, role: { in: FOUNDER_ROLES } },
            include: {
                company: { select: { id: true, name: true, slug: true } },
            },
        });
        const orphaned: { id: string; name: string; slug: string }[] = [];
        for (const m of ownedCompanies) {
            const otherFounders = await prisma.companyMember.count({
                where: {
                    companyId: m.companyId,
                    role: { in: FOUNDER_ROLES },
                    userId: { not: userId },
                },
            });
            if (otherFounders === 0) orphaned.push(m.company);
        }
        if (orphaned.length > 0) throw new SoleOwnerBlocked(orphaned);

        // Snapshot the data we need for notifications before we sever the
        // user's memberships in the transaction below.
        const memberships = await prisma.companyMember.findMany({
            where: { userId },
            include: {
                company: { select: { id: true, name: true, slug: true } },
            },
        });
        const displayName = me.name?.trim() || "A teammate";

        await prisma.$transaction(async (tx) => {
            // Drop team memberships so the seat frees up and the user
            // disappears from /home/company immediately. (We've already
            // proven they aren't the sole owner of any of them.)
            await tx.companyMember.deleteMany({ where: { userId } });

            // Revoke any invites they sent that haven't been accepted —
            // those links shouldn't continue to work in their name.
            await tx.companyInvitation.deleteMany({
                where: { invitedById: userId, acceptedAt: null },
            });

            // Sever the Supabase / OAuth identity so the user can sign up
            // fresh without colliding on unique constraints, and so any
            // existing JWT they have lying around can't resurrect this row.
            // Anonymize displayed PII; structural data (applications,
            // interviews, messages, listings) is preserved.
            await tx.user.update({
                where: { id: userId },
                data: {
                    deletedAt: now,
                    isOnline: false,
                    activeCompanyId: null,

                    supabaseUserId: null,
                    googleId: null,
                    googleRefreshToken: null,
                    googleAccessToken: null,
                    googleTokenExpiresAt: null,
                    googleConnectedEmail: null,

                    email: null,
                    phone: null,
                    name: null,
                    image: null,
                },
            });
        });

        // Best-effort notifications outside the transaction — a notification
        // delivery failure should never block account deletion.
        for (const m of memberships) {
            const remaining = await prisma.companyMember.findMany({
                where: { companyId: m.companyId },
                select: { userId: true },
            });
            if (remaining.length === 0) continue;
            await notifyMany(
                remaining.map((r) => r.userId),
                {
                    type: NotificationType.GENERIC,
                    title: `${displayName} left ${m.company.name}`,
                    body: "They deleted their SpiderSkill account. Their listings remain with the company.",
                    link: `/home/company`,
                },
            );
        }

        api.ok({ ok: true }, "Account deleted");
    } catch (err) {
        handleApiError(err, api);
    }
}
