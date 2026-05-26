import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * GET /company/:id/invites — list every invite for this company, newest
 * first. Includes accepted + expired rows; the UI groups them by status.
 */
export default async function listCompanyInvitations(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const companyId = req.params.id as string;
        const invitations = await prisma.companyInvitation.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            include: {
                invitedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        api.ok({ invitations });
    } catch (err) {
        handleApiError(err, api);
    }
}
