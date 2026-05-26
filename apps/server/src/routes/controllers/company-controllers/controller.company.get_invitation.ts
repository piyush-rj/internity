import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * GET /invitation/:token — returns the company + invite info for the accept
 * page. Auth-gated by the router but the user might not yet match the
 * invited email — that mismatch surfaces on accept, not here.
 */
export default async function getCompanyInvitation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const token = req.params.token as string;
        const invite = await prisma.companyInvitation.findUnique({
            where: { token },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                        verificationStatus: true,
                    },
                },
                invitedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        if (!invite) throw new NotFound("Invite not found or already revoked");

        const expired = invite.expiresAt.getTime() < Date.now();
        api.ok({
            invitation: invite,
            state: invite.acceptedAt
                ? "accepted"
                : expired
                  ? "expired"
                  : "pending",
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
