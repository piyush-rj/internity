import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * DELETE /company/:id/invites/:inviteId — owner revokes a pending invite.
 * Accepted invites can't be revoked (use remove-member instead).
 */
export default async function revokeCompanyInvitation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const companyId = req.params.id as string;
        const inviteId = req.params.inviteId as string;

        const invite = await prisma.companyInvitation.findUnique({
            where: { id: inviteId },
            select: { id: true, companyId: true, acceptedAt: true },
        });
        if (!invite || invite.companyId !== companyId) {
            throw new NotFound("Invite not found");
        }
        if (invite.acceptedAt) {
            throw new InvalidRequest(
                "This invite has already been accepted. Remove the member from the team instead.",
            );
        }

        await prisma.companyInvitation.delete({ where: { id: inviteId } });
        api.ok({ ok: true }, "Invite revoked");
    } catch (err) {
        handleApiError(err, api);
    }
}
