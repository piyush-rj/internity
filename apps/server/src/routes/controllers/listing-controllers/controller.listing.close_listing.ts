import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function closeListing(
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
        const updated = await prisma.listing.update({
            where: { id },
            data: { closedAt: new Date() },
            include: { company: true },
        });
        api.ok({ listing: updated });
    } catch (err) {
        handleApiError(err, api);
    }
}
