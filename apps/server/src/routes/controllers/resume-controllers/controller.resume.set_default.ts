import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function setDefaultResume(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new InvalidRequest("Create your profile first");

        const target = await prisma.resume.findUnique({
            where: { id },
            select: { id: true, studentId: true, url: true },
        });
        if (!target || target.studentId !== profile.id) throw new NotFound();

        await prisma.$transaction([
            prisma.resume.updateMany({
                where: { studentId: profile.id, isDefault: true },
                data: { isDefault: false },
            }),
            prisma.resume.update({
                where: { id: target.id },
                data: { isDefault: true },
            }),
            prisma.studentProfile.update({
                where: { id: profile.id },
                data: { resumeUrl: target.url },
            }),
        ]);

        api.ok({ ok: true }, "Default resume updated");
    } catch (err) {
        handleApiError(err, api);
    }
}
