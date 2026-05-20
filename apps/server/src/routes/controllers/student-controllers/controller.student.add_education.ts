import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    institute: z.string().min(1),
    degree: z.string().min(1),
    fieldOfStudy: z.string().nullable().optional(),
    startYear: z.number().int(),
    endYear: z.number().int().nullable().optional(),
    grade: z.string().nullable().optional(),
    current: z.boolean().nullable().optional(),
});

export default async function addEducation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new InvalidRequest("Create your profile first");
        const row = await prisma.education.create({
            data: {
                studentId: profile.id,
                institute: body.institute,
                degree: body.degree,
                fieldOfStudy: body.fieldOfStudy ?? null,
                startYear: body.startYear,
                endYear: body.endYear ?? null,
                grade: body.grade ?? null,
                ...(body.current !== null &&
                    body.current !== undefined && { current: body.current }),
            },
        });
        api.created({ education: row });
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
