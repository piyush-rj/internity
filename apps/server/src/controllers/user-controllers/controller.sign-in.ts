import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";
import JwtServices from "../../services/auth_services/jwt_services";

export default class UserRegistration {
    static user_auth_schema = z.object({
        name: z.string(),
        email: z.email(),
        image: z.url().optional(),
        googleId: z.string(),
    });

    static async process_login(req: Request, res: Response) {
        console.log("data from frontend is: ", req.body);
        const { data, success } = UserRegistration.user_auth_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const user = await prisma.user.upsert({
                where: { googleId: data.googleId },
                update: {
                    name: data.name,
                    email: data.email,
                    image: data.image ?? null,
                },
                create: {
                    googleId: data.googleId,
                    email: data.email,
                    name: data.name,
                    image: data.image ?? null,
                },
            });

            const token = JwtServices.assign_token({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            });

            ResponseWriter.success(res, { user, token }, "Signed in");
        } catch (error) {
            console.error("sign-in error:", error);
            ResponseWriter.server_error(res);
        }
    }
}
