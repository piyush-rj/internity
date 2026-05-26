import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";

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

        if (target.role === CompanyRole.OWNER) {
            const owners = await prisma.companyMember.count({
                where: { companyId, role: CompanyRole.OWNER },
            });
            if (owners <= 1) {
                throw new InvalidRequest("Cannot remove the last owner");
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
