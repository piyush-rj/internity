import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentProject {
    static create_schema = z.object({
        title: z.string().min(1),
        link: z.url().optional(),
        description: z.string().optional(),
        startDate: z.iso.datetime().optional(),
        endDate: z.iso.datetime().optional(),
    });

    static update_schema = StudentProject.create_schema.partial();

    private static async student_id_for(userId: string) {
        const sp = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return sp?.id ?? null;
    }

    static async add(req: Request, res: Response) {
        const { data, success } = StudentProject.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentProject.student_id_for(req.user!.id);
            if (!studentId) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }
            const row = await prisma.project.create({
                data: { studentId, ...data },
            });
            ResponseWriter.success(res, { project: row }, "Created", 201);
        } catch (err) {
            console.error("project.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = StudentProject.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentProject.student_id_for(req.user!.id);
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.project.updateMany({
                where: { id, studentId },
                data,
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("project.update:", err);
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
            const studentId = await StudentProject.student_id_for(req.user!.id);
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.project.deleteMany({
                where: { id, studentId },
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("project.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
