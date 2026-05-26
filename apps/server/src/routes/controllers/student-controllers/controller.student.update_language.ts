import type { Request, Response } from "express";
import { z } from "zod";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1).optional(),
    proficiency: z.number().int().min(1).max(5).nullable().optional(),
});

export default async function updateLanguage(
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
        if (body.name !== undefined) data.name = body.name;
        if (body.proficiency !== undefined) data.proficiency = body.proficiency;

        if (Object.keys(data).length === 0) {
            api.ok({ ok: true });
            return;
        }

        const result = await prisma.language.updateMany({
            where: { id: req.params.row_id as string, studentId: profile.id },
            data,
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
