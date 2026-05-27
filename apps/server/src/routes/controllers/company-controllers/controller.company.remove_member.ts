import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";
import { isFounderRole } from "../../../utils/company-roles.ts";

// FOUNDER_OWNER + CO_FOUNDER + legacy OWNER all count as "founder" for the
// last-founder retention check.
const FOUNDER_ROLES: CompanyRole[] = [
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
];

export default async function removeCompanyMember(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const companyId = req.params.id as string;
        const userId = req.params.userId as string;
        const target = await prisma.companyMember.findUnique({
            where: { companyId_userId: { companyId, userId } },
        });
        if (!target) throw new NotFound();

        if (isFounderRole(target.role)) {
            const founders = await prisma.companyMember.count({
                where: { companyId, role: { in: FOUNDER_ROLES } },
            });
            if (founders <= 1) {
                throw new InvalidRequest(
                    "Cannot remove the last founder — promote a teammate first.",
                );
            }
        }

        await prisma.companyMember.delete({
            where: { companyId_userId: { companyId, userId } },
        });
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
