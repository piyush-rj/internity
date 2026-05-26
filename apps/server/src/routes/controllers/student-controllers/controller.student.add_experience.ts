import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    company: z.string().min(1),
    title: z.string().min(1),
    location: z.string().nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    current: z.boolean().nullable().optional(),
    description: z.string().nullable().optional(),
});

export default async function addExperience(
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
        const row = await prisma.workExperience.create({
            data: {
                studentId: profile.id,
                company: body.company,
                title: body.title,
                location: body.location ?? null,
                startDate: body.startDate,
                endDate: body.endDate ?? null,
                description: body.description ?? null,
                ...(body.current !== null &&
                    body.current !== undefined && { current: body.current }),
            },
        });
        api.created({ experience: row });
    } catch (err) {
        handleApiError(err, api);
    }
}
