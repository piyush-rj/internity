import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getPublicProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.params.user_id as string },
            include: {
                educations: true,
                experiences: true,
                projects: true,
                skills: { include: { skill: true } },
                certifications: true,
                languages: true,
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
        });
        if (!profile) {
            api.notFound();
            return;
        }
        api.ok({ profile });
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
