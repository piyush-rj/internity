import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1),
    proficiency: z.number().int().min(1).max(5).nullable().optional(),
});

export default async function addLanguage(
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
        const row = await prisma.language.create({
            data: {
                studentId: profile.id,
                name: body.name,
                proficiency: body.proficiency ?? null,
            },
        });
        api.created({ language: row });
    } catch (err) {
        handleApiError(err, api);
    }
}
