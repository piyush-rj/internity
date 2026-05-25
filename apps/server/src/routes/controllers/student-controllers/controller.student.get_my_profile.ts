import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getMyProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
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
            api.notFound("Profile not created");
            return;
        }
        api.ok({ profile });
    } catch (err) {
        handleApiError(err, api);
    }
}
