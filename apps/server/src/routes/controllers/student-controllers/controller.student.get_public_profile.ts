import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getPublicProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.params.user_id as string },
            include: {
                educations: true,
                experiences: true,
                projects: true,
                skills: { include: { skill: true } },
                certifications: true,
                languages: true,
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
        });
        if (!profile) {
            api.notFound();
            return;
        }
        api.ok({ profile });
    } catch (err) {
        handleApiError(err, api);
    }
}
