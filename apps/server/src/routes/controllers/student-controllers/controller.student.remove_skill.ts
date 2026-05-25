import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function removeSkill(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new NotFound();
        await prisma.studentSkill.deleteMany({
            where: {
                studentId: profile.id,
                skillId: req.params.skill_id as string,
            },
        });
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
