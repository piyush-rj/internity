import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";

const Body = z.object({
    email: z.string().email(),
    role: z.enum(["OWNER", "MEMBER"]).optional(),
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
        const member = await prisma.companyMember.create({
            data: {
                companyId: req.params.id as string,
                userId: target.id,
                role: (body.role as CompanyRole) ?? CompanyRole.MEMBER,
            },
        });
        api.created({ member }, "Member added");
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
