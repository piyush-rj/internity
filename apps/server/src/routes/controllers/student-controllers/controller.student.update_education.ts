import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    institute: z.string().min(1).optional(),
    degree: z.string().min(1).optional(),
    fieldOfStudy: z.string().nullable().optional(),
    startYear: z.number().int().optional(),
    endYear: z.number().int().nullable().optional(),
    grade: z.string().nullable().optional(),
    current: z.boolean().nullable().optional(),
});

export default async function updateEducation(
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
        if (!profile) throw new NotFound();

        const data: Record<string, unknown> = {};
        if (body.institute !== undefined) data.institute = body.institute;
        if (body.degree !== undefined) data.degree = body.degree;
        if (body.fieldOfStudy !== undefined) data.fieldOfStudy = body.fieldOfStudy;
        if (body.startYear !== undefined) data.startYear = body.startYear;
        if (body.endYear !== undefined) data.endYear = body.endYear;
        if (body.grade !== undefined) data.grade = body.grade;
        if (body.current !== undefined && body.current !== null) {
            data.current = body.current;
        }

        if (Object.keys(data).length === 0) {
            api.ok({ ok: true });
            return;
        }

        const result = await prisma.education.updateMany({
            where: { id: req.params.row_id as string, studentId: profile.id },
            data,
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
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
