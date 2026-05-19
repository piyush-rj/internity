import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listCompanyMembers(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const members = await prisma.companyMember.findMany({
            where: { companyId: req.params.id as string },
            orderBy: { joinedAt: "asc" },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });
        api.ok({ members });
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
