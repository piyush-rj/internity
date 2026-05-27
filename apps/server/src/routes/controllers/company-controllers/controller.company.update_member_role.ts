import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";
import { isFounderRole } from "../../../utils/company-roles.ts";

const Body = z.object({
    role: z.enum(["FOUNDER_OWNER", "CO_FOUNDER", "HR", "MEMBER"]),
});

const FOUNDER_ROLES: CompanyRole[] = [
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
];

export default async function updateCompanyMemberRole(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const nextRole = body.role as CompanyRole;
        const companyId = req.params.id as string;
        const userId = req.params.userId as string;
        const target = await prisma.companyMember.findUnique({
            where: { companyId_userId: { companyId, userId } },
        });
        if (!target) throw new NotFound();

        // Block the demotion when the target is the only remaining founder —
        // the company must always have at least one person with admin
        // capabilities.
        if (isFounderRole(target.role) && !isFounderRole(nextRole)) {
            const founders = await prisma.companyMember.count({
                where: { companyId, role: { in: FOUNDER_ROLES } },
            });
            if (founders <= 1) {
                throw new InvalidRequest(
                    "Cannot demote the last founder — promote another teammate first.",
                );
            }
        }

        const updated = await prisma.companyMember.update({
            where: { companyId_userId: { companyId, userId } },
            data: { role: nextRole },
        });
        api.ok({ member: updated });
    } catch (err) {
        handleApiError(err, api);
    }
}
