import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { canManageApplicants } from "../../../utils/company-roles.ts";

export default async function getApplication(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const a = await prisma.application.findUnique({
            where: { id },
            include: {
                listing: { include: { company: true } },
                student: { include: { studentProfile: true } },
            },
        });
        if (!a) throw new NotFound();

        const isApplicant = a.studentId === req.user!.id;
        let canViewAsTeam = false;
        if (!isApplicant) {
            const m = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: {
                        companyId: a.listing.companyId,
                        userId: req.user!.id,
                    },
                },
            });
            canViewAsTeam = m !== null && canManageApplicants(m.role);
        }
        if (!isApplicant && !canViewAsTeam) throw new Forbidden("Not allowed");

        api.ok({ application: a });
    } catch (err) {
        handleApiError(err, api);
    }
}
