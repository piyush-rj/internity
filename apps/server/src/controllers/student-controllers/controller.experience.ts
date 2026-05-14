import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentExperience {
    static create_schema = z.object({
        company: z.string().min(1),
        title: z.string().min(1),
        location: z.string().optional(),
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime().optional(),
        current: z.boolean().optional(),
        description: z.string().optional(),
    });

    static update_schema = StudentExperience.create_schema.partial();

    private static async student_id_for(userId: string) {
        const sp = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return sp?.id ?? null;
    }

    static async add(req: Request, res: Response) {
        const { data, success } = StudentExperience.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentExperience.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }
            const row = await prisma.workExperience.create({
                data: { studentId, ...data },
            });
            ResponseWriter.success(res, { experience: row }, "Created", 201);
        } catch (err) {
            console.error("experience.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = StudentExperience.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentExperience.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.workExperience.updateMany({
                where: { id, studentId },
                data,
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("experience.update:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async remove(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentExperience.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.workExperience.deleteMany({
                where: { id, studentId },
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("experience.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
