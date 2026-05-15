import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentSkillController {
    static add_schema = z.object({
        name: z.string().min(1),
        level: z.number().int().min(1).max(5).optional(),
    });

    static async add(req: Request, res: Response) {
        const { data, success } = StudentSkillController.add_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const sp = await prisma.studentProfile.findUnique({
                where: { userId: req.user!.id },
                select: { id: true },
            });
            if (!sp) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }

            const normalized = data.name.trim().toLowerCase();
            const skill = await prisma.skill.upsert({
                where: { name: normalized },
                create: { name: normalized },
                update: {},
            });

            const link = await prisma.studentSkill.upsert({
                where: {
                    studentId_skillId: { studentId: sp.id, skillId: skill.id },
                },
                create: {
                    studentId: sp.id,
                    skillId: skill.id,
                    level: data.level,
                },
                update: { level: data.level },
            });

            ResponseWriter.success(res, { skill, link });
        } catch (err) {
            console.error("skill.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async remove(req: Request, res: Response) {
        const skillId = req.params.skillId;
        if (typeof skillId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const sp = await prisma.studentProfile.findUnique({
                where: { userId: req.user!.id },
                select: { id: true },
            });
            if (!sp) {
                ResponseWriter.not_found(res);
                return;
            }

            await prisma.studentSkill.deleteMany({
                where: { studentId: sp.id, skillId },
            });

            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("skill.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
