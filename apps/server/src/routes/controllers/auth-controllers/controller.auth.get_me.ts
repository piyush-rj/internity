import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getMe(req: Request, res: Response): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                studentProfile: { select: { id: true } },
                employerProfile: { select: { id: true } },
            },
        });
        if (!user) {
            api.notFound();
            return;
        }
        api.ok({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: user.role,
            roleConfirmed: user.roleConfirmed,
            isPremium: user.isPremium,
            needsOnboarding: !user.name || user.name.trim().length === 0,
            hasStudentProfile: user.studentProfile !== null,
            hasEmployerProfile: user.employerProfile !== null,
        });
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
