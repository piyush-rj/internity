import type { Request, Response } from "express";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listMyResumes(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new InvalidRequest("Create your profile first");

        const items = await prisma.resume.findMany({
            where: { studentId: profile.id },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });

        api.ok({ items });
    } catch (err) {
        handleApiError(err, api);
    }
}
