import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

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
        let isMember = false;
        if (!isApplicant) {
            const m = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: {
                        companyId: a.listing.companyId,
                        userId: req.user!.id,
                    },
                },
            });
            isMember = m !== null;
        }
        if (!isApplicant && !isMember) throw new Forbidden("Not allowed");

        api.ok({ application: a });
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
