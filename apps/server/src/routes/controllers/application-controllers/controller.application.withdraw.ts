import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { ApplicationStatus, prisma } from "../../../db.ts";

export default async function withdrawApplication(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const result = await prisma.application.updateMany({
            where: { id: req.params.id as string, studentId: req.user!.id },
            data: {
                status: ApplicationStatus.WITHDRAWN,
                statusUpdatedAt: new Date(),
            },
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
