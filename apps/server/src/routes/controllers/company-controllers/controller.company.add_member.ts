import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";
import { normaliseCustomRole } from "../../../utils/company-roles.ts";

const Body = z.object({
    email: z.string().email(),
    role: z
        .enum(["FOUNDER_OWNER", "CO_FOUNDER", "HR", "MEMBER", "OTHER"])
        .optional(),
    customRole: z.string().max(120).optional().nullable(),
});

export default async function addCompanyMember(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const target = await prisma.user.findUnique({
            where: { email: body.email },
        });
        if (!target) throw new NotFound("No user with that email");
        const role: CompanyRole =
            (body.role as CompanyRole) ?? CompanyRole.MEMBER;
        const customRole = normaliseCustomRole(
            role,
            body.customRole ?? null,
            (msg) => new InvalidRequest(msg),
        );
        const member = await prisma.companyMember.create({
            data: {
                companyId: req.params.id as string,
                userId: target.id,
                role,
                customRole,
            },
        });
        api.created({ member }, "Member added");
    } catch (err) {
        handleApiError(err, api);
    }
}
