import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// Deletes a resume row. If the deleted row was the default, promote the
// most recently uploaded remaining resume (if any) to default and keep
// StudentProfile.resumeUrl in sync.
export default async function deleteResume(
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
            select: { id: true, studentId: true, isDefault: true },
        });
        if (!target || target.studentId !== profile.id) throw new NotFound();

        await prisma.$transaction(async (tx) => {
            await tx.resume.delete({ where: { id: target.id } });

            if (target.isDefault) {
                const next = await tx.resume.findFirst({
                    where: { studentId: profile.id },
                    orderBy: { createdAt: "desc" },
                });
                if (next) {
                    await tx.resume.update({
                        where: { id: next.id },
                        data: { isDefault: true },
                    });
                    await tx.studentProfile.update({
                        where: { id: profile.id },
                        data: { resumeUrl: next.url },
                    });
                } else {
                    await tx.studentProfile.update({
                        where: { id: profile.id },
                        data: { resumeUrl: null },
                    });
                }
            }
        });

        api.ok({ ok: true }, "Resume deleted");
    } catch (err) {
        handleApiError(err, api);
    }
}
