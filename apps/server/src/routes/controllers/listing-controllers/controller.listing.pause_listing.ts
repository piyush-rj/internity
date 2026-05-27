import type { Request, Response } from "express";
import {
    ApiError,
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { canManageListings } from "../../../utils/company-roles.ts";

// pauses a listing from public browse and keeps it visible to the founder
export default async function pauseListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: { companyId: true, pausedAt: true },
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
                "Your role can't pause listings — ask a founder or co-founder.",
            );
        }

        const updated = found.pausedAt
            ? await prisma.listing.findUniqueOrThrow({
                  where: { id },
                  include: { company: true },
              })
            : await prisma.listing.update({
                  where: { id },
                  data: { pausedAt: new Date() },
                  include: { company: true },
              });
        api.ok({ listing: updated }, "Hiring paused for this listing");
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}
