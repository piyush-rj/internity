import type { Request, Response } from "express";
import {
    ApiError,
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { canManageListings } from "../../../utils/company-roles.ts";

const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// bumps expiresAt 30 days forward and clears closedAt
export default async function renewListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: { companyId: true, takenDownAt: true },
        });
        if (!found) throw new NotFound();
        if (found.takenDownAt) {
            throw new Forbidden(
                "This listing was removed by admin and can't be renewed.",
            );
        }
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
                "Your role can't renew listings — ask a founder or co-founder.",
            );
        }

        const updated = await prisma.listing.update({
            where: { id },
            data: {
                expiresAt: new Date(Date.now() + LISTING_TTL_MS),
                closedAt: null,
            },
            include: { company: true },
        });
        api.ok({ listing: updated }, "Listing renewed for 30 days");
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}
