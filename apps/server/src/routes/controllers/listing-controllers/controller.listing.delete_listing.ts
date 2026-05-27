import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { canManageListings } from "../../../utils/company-roles.ts";

export default async function deleteListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: { companyId: true },
        });
        if (!found) throw new NotFound();
        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: found.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");
        if (!canManageListings(member.role)) {
            throw new Forbidden(
                "Your role can't delete listings — ask a founder or co-founder.",
            );
        }
        await prisma.listing.delete({ where: { id } });
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
