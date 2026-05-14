import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class StudentProfileController {
    static create_schema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        dob: z.iso.datetime().optional(),
        gender: z
            .enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"])
            .optional(),
        bio: z.string().optional(),
    });

    static update_schema = StudentProfileController.create_schema.partial();

    static async get_my_profile(req: Request, res: Response) {
        try {
            const profile = await prisma.studentProfile.findUnique({
                where: { userId: req.user!.id },
                include: {
                    educations: true,
                    experiences: true,
                    projects: true,
                    skills: { include: { skill: true } },
                    certifications: true,
                    languages: true,
                },
            });
            if (!profile) {
                ResponseWriter.not_found(res, "Profile not created");
                return;
            }
            ResponseWriter.success(res, { profile });
        } catch (err) {
            console.error("student.get_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async create_my_profile(req: Request, res: Response) {
        const { data, success } =
            StudentProfileController.create_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const profile = await prisma.studentProfile.create({
                data: { userId: req.user!.id, ...data },
            });
            ResponseWriter.success(res, { profile }, "Profile created", 201);
        } catch (err) {
            console.error("student.create_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update_my_profile(req: Request, res: Response) {
        const { data, success } =
            StudentProfileController.update_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const profile = await prisma.studentProfile.update({
                where: { userId: req.user!.id },
                data,
            });
            ResponseWriter.success(res, { profile });
        } catch (err) {
            console.error("student.update_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async get_public_profile(req: Request, res: Response) {
        const userId = req.params.id;
        if (typeof userId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const profile = await prisma.studentProfile.findUnique({
                where: { userId },
                include: {
                    educations: true,
                    experiences: true,
                    projects: true,
                    skills: { include: { skill: true } },
                    certifications: true,
                    languages: true,
                },
            });
            if (!profile) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { profile });
        } catch (err) {
            console.error("student.get_public_profile:", err);
            ResponseWriter.server_error(res);
        }
    }
}
