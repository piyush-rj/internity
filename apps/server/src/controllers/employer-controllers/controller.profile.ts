import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class EmployerProfileController {
    static create_schema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
    });

    static update_schema = EmployerProfileController.create_schema.partial();

    // GET /employer/me — profile + companies the caller belongs to
    static async get_my_profile(req: Request, res: Response) {
        try {
            const profile = await prisma.employerProfile.findUnique({
                where: { userId: req.user!.id },
            });
            const memberships = await prisma.companyMember.findMany({
                where: { userId: req.user!.id },
                include: { company: true },
            });
            ResponseWriter.success(res, { profile, memberships });
        } catch (err) {
            console.error("employer.get_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }

    // POST /employer/me
    static async create_my_profile(req: Request, res: Response) {
        const { data, success } =
            EmployerProfileController.create_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const profile = await prisma.employerProfile.create({
                data: { userId: req.user!.id, ...data },
            });
            ResponseWriter.success(res, { profile }, "Profile created", 201);
        } catch (err) {
            console.error("employer.create_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }

    // PATCH /employer/me
    static async update_my_profile(req: Request, res: Response) {
        const { data, success } =
            EmployerProfileController.update_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const profile = await prisma.employerProfile.update({
                where: { userId: req.user!.id },
                data,
            });
            ResponseWriter.success(res, { profile });
        } catch (err) {
            console.error("employer.update_my_profile:", err);
            ResponseWriter.server_error(res);
        }
    }
}
