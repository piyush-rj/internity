import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";

const Body = z.object({ role: z.enum(["OWNER", "MEMBER"]) });

export default async function updateCompanyMemberRole(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const companyId = req.params.id as string;
        const userId = req.params.userId as string;
        const target = await prisma.companyMember.findUnique({
            where: { companyId_userId: { companyId, userId } },
        });
        if (!target) throw new NotFound();

        if (
            body.role === CompanyRole.MEMBER &&
            target.role === CompanyRole.OWNER
        ) {
            const owners = await prisma.companyMember.count({
                where: { companyId, role: CompanyRole.OWNER },
            });
            if (owners <= 1) {
                throw new InvalidRequest("Cannot demote the last owner");
            }
        }

        const updated = await prisma.companyMember.update({
            where: { companyId_userId: { companyId, userId } },
            data: { role: body.role as CompanyRole },
        });
        api.ok({ member: updated });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
