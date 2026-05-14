import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentCertification {
    static create_schema = z.object({
        name: z.string().min(1),
        issuer: z.string().optional(),
        issueDate: z.iso.datetime().optional(),
        credentialUrl: z.url().optional(),
    });

    static update_schema = StudentCertification.create_schema.partial();

    private static async student_id_for(userId: string) {
        const sp = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return sp?.id ?? null;
    }

    static async add(req: Request, res: Response) {
        const { data, success } = StudentCertification.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentCertification.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }
            const row = await prisma.certification.create({
                data: { studentId, ...data },
            });
            ResponseWriter.success(res, { certification: row }, "Created", 201);
        } catch (err) {
            console.error("certification.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = StudentCertification.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const studentId = await StudentCertification.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.certification.updateMany({
                where: { id, studentId },
                data,
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("certification.update:", err);
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
            const studentId = await StudentCertification.student_id_for(
                req.user!.id,
            );
            if (!studentId) {
                ResponseWriter.not_found(res);
                return;
            }
            const result = await prisma.certification.deleteMany({
                where: { id, studentId },
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("certification.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
