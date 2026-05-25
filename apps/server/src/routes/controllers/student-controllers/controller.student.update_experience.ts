import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    company: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    location: z.string().nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    current: z.boolean().nullable().optional(),
    description: z.string().nullable().optional(),
});

export default async function updateExperience(
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
        if (body.company !== undefined) data.company = body.company;
        if (body.title !== undefined) data.title = body.title;
        if (body.location !== undefined) data.location = body.location;
        if (body.startDate !== undefined) data.startDate = body.startDate;
        if (body.endDate !== undefined) data.endDate = body.endDate;
        if (body.description !== undefined) data.description = body.description;
        if (body.current !== undefined && body.current !== null) {
            data.current = body.current;
        }

        if (Object.keys(data).length === 0) {
            api.ok({ ok: true });
            return;
        }

        const result = await prisma.workExperience.updateMany({
            where: { id: req.params.row_id as string, studentId: profile.id },
            data,
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
