import type { Request, Response } from "express";
import z from "zod";
import { prisma, UserRole } from "database";
import ResponseWriter from "../../class/response_writer";

export default class AuthMe {
    static role_schema = z.object({
        role: z.enum([UserRole.STUDENT, UserRole.EMPLOYER]),
    });

    static async get_me(req: Request, res: Response) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                include: {
                    studentProfile: { select: { id: true } },
                    employerProfile: { select: { id: true } },
                },
            });
            if (!user) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                isPremium: user.isPremium,
                hasStudentProfile: !!user.studentProfile,
                hasEmployerProfile: !!user.employerProfile,
            });
        } catch (err) {
            console.error("me.get:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async set_role(req: Request, res: Response) {
        const { data, success } = AuthMe.role_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const user = await prisma.user.update({
                where: { id: req.user!.id },
                data: { role: data.role },
            });
            ResponseWriter.success(res, { role: user.role }, "Role updated");
        } catch (err) {
            console.error("me.set_role:", err);
            ResponseWriter.server_error(res);
        }
    }
}
