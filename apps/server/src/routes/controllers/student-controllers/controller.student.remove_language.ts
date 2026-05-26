import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function removeLanguage(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new NotFound();
        const result = await prisma.language.deleteMany({
            where: { id: req.params.row_id as string, studentId: profile.id },
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
