import crypto from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const Body = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email"),
    role: z.enum(["OWNER", "MEMBER"]).optional(),
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

        const existingMember = await prisma.user.findFirst({
            where: {
                email: body.email,
                companyMemberships: { some: { companyId } },
            },
            select: { id: true },
        });
        if (existingMember) {
            throw new InvalidRequest(
                "That email is already on your team.",
            );
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

        const invite = await prisma.companyInvitation.create({
            data: {
                companyId,
                email: body.email,
                role: (body.role as CompanyRole) ?? CompanyRole.MEMBER,
                token: crypto.randomBytes(24).toString("hex"),
                invitedById: req.user!.id,
                expiresAt: new Date(Date.now() + INVITE_TTL_MS),
            },
        });

        api.created({ invitation: invite }, "Invite created");
    } catch (err) {
        handleApiError(err, api);
    }
}
