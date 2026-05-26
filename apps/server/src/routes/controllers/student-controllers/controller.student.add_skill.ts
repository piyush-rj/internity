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
    level: z.number().int().min(1).max(5).nullable().optional(),
});

export default async function addSkill(
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

        const normalized = body.name.trim().toLowerCase();
        const skill = await prisma.skill.upsert({
            where: { name: normalized },
            create: { name: normalized },
            update: {},
        });
        const link = await prisma.studentSkill.upsert({
            where: {
                studentId_skillId: { studentId: profile.id, skillId: skill.id },
            },
            create: {
                studentId: profile.id,
                skillId: skill.id,
                level: body.level ?? null,
            },
            update: { level: body.level ?? null },
        });

        api.ok({
            skill,
            link: {
                studentId: link.studentId,
                skillId: link.skillId,
                level: link.level,
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
