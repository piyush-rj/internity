import type { Request, Response } from "express";
import {
    Forbidden,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * POST /invitation/:token/accept — authed. Verifies the signed-in user's
 * email matches the invite, then upserts a CompanyMember row and marks the
 * invite accepted. Wrapped in a transaction so both writes succeed together.
 */
export default async function acceptCompanyInvitation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const token = req.params.token as string;
        const invite = await prisma.companyInvitation.findUnique({
            where: { token },
            select: {
                id: true,
                companyId: true,
                email: true,
                role: true,
                acceptedAt: true,
                expiresAt: true,
            },
        });
        if (!invite) throw new NotFound("Invite not found");
        if (invite.acceptedAt) {
            throw new InvalidRequest("This invite has already been accepted.");
        }
        if (invite.expiresAt.getTime() < Date.now()) {
            throw new InvalidRequest("This invite has expired.");
        }

        const callerEmail = req.user!.email?.toLowerCase() ?? null;
        if (!callerEmail || callerEmail !== invite.email.toLowerCase()) {
            throw new Forbidden(
                "This invite was sent to a different email. Sign in with the invited address.",
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.companyMember.upsert({
                where: {
                    companyId_userId: {
                        companyId: invite.companyId,
                        userId: req.user!.id,
                    },
                },
                create: {
                    companyId: invite.companyId,
                    userId: req.user!.id,
                    role: invite.role,
                },
                update: {}, // already a member — leave existing role alone
            });
            await tx.companyInvitation.update({
                where: { id: invite.id },
                data: {
                    acceptedAt: new Date(),
                    acceptedById: req.user!.id,
                },
            });
            return member;
        });

        api.ok({ member: result }, "Joined company");
    } catch (err) {
        handleApiError(err, api);
    }
}
