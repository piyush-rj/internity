import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    title: z.string().min(1),
    link: z.string().url().nullable().optional(),
    description: z.string().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
});

export default async function addProject(
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
        const row = await prisma.project.create({
            data: {
                studentId: profile.id,
                title: body.title,
                link: body.link ?? null,
                description: body.description ?? null,
                startDate: body.startDate ?? null,
                endDate: body.endDate ?? null,
            },
        });
        api.created({ project: row });
    } catch (err) {
        handleApiError(err, api);
    }
}
