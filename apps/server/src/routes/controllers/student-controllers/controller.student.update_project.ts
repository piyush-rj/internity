import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    title: z.string().min(1).optional(),
    link: z.string().url().nullable().optional(),
    description: z.string().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
});

export default async function updateProject(
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
        if (body.title !== undefined) data.title = body.title;
        if (body.link !== undefined) data.link = body.link;
        if (body.description !== undefined) data.description = body.description;
        if (body.startDate !== undefined) data.startDate = body.startDate;
        if (body.endDate !== undefined) data.endDate = body.endDate;

        if (Object.keys(data).length === 0) {
            api.ok({ ok: true });
            return;
        }

        const result = await prisma.project.updateMany({
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
