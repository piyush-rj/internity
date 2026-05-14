import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentEducation {
    static create_schema = z.object({
        institute: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string().optional(),
        startYear: z.number().int(),
        endYear: z.number().int().optional(),
        grade: z.string().optional(),
        current: z.boolean().optional(),
    });

    static update_schema = StudentEducation.create_schema.partial();

    private static async student_id_for(userId: string) {
        const sp = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return sp?.id ?? null;
    }

    static async add(req: Request, res: Response) {
        const { data, success } = StudentEducation.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentEducation.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }
            const row = await prisma.education.create({
                data: { studentId, ...data },
            });
            ResponseWriter.success(res, { education: row }, "Created", 201);
        } catch (err) {
            console.error("education.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = StudentEducation.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentEducation.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.education.updateMany({
                where: { id, studentId },
                data,
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("education.update:", err);
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
            const studentId = await StudentEducation.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.education.deleteMany({
                where: { id, studentId },
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("education.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
