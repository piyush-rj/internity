import crypto from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";
import { normaliseCustomRole } from "../../../utils/company-roles.ts";
import { notify } from "../../../services/notifications.ts";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const Body = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    role: z
        .enum(["FOUNDER_OWNER", "CO_FOUNDER", "HR", "MEMBER", "OTHER"])
        .optional(),
    customRole: z.string().max(120).optional().nullable(),
});

/**
 * POST /company/:id/invites — owner creates a pending team invite by email.
 * Rejects if the email already belongs to a member, or already has an open
 * invite for this company. Returns the token-shaped accept URL so the owner
 * can share it directly (no email integration yet — copy-paste flow).
 */
export default async function createCompanyInvitation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const companyId = req.params.id as string;
        const body = Body.parse(req.body);

        // Inviting yourself is the most common "already a member" confusion —
        // give it a message that names the cause instead of the generic one.
        const callerEmail = req.user!.email?.toLowerCase() ?? null;
        if (callerEmail && callerEmail === body.email) {
            throw new InvalidRequest(
                "That's your own email — you're already on the team.",
            );
        }

        const existingMember = await prisma.user.findFirst({
            where: {
                email: body.email,
                companyMemberships: { some: { companyId } },
            },
            select: { id: true },
        });
        if (existingMember) {
            throw new InvalidRequest("That email is already on your team.");
        }

        const existingInvite = await prisma.companyInvitation.findFirst({
            where: {
                companyId,
                email: body.email,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { id: true, token: true },
        });
        if (existingInvite) {
            throw new InvalidRequest(
                "An invite is already pending for that email. Share the existing link or revoke it first.",
            );
        }

        const role: CompanyRole =
            (body.role as CompanyRole) ?? CompanyRole.MEMBER;
        const customRole = normaliseCustomRole(
            role,
            body.customRole ?? null,
            (msg) => new InvalidRequest(msg),
        );

        const invite = await prisma.companyInvitation.create({
            data: {
                companyId,
                email: body.email,
                role,
                customRole,
                token: crypto.randomBytes(24).toString("hex"),
                invitedById: req.user!.id,
                expiresAt: new Date(Date.now() + INVITE_TTL_MS),
            },
        });

        // If the invited email already belongs to an account, notify them now.
        // Anyone who signs up later is caught by the reconciliation in getMe.
        const invitedUser = await prisma.user.findFirst({
            where: {
                email: { equals: body.email, mode: "insensitive" },
                deletedAt: null,
            },
            select: { id: true },
        });
        if (invitedUser) {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { name: true },
            });
            await notify({
                userId: invitedUser.id,
                type: "COMPANY_INVITE",
                title: `You're invited to join ${company?.name ?? "a company"}`,
                body: "Accept the invite to join the team.",
                link: `/home/invite/${invite.token}`,
            });
        }

        api.created({ invitation: invite }, "Invite created");
    } catch (err) {
        handleApiError(err, api);
    }
}
