import type { Request, Response } from "express";
import { z } from "zod";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1).optional(),
    issuer: z.string().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    credentialUrl: z.string().url().nullable().optional(),
});

export default async function updateCertification(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!profile) throw new NotFound();

        const data: Record<string, unknown> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.issuer !== undefined) data.issuer = body.issuer;
        if (body.issueDate !== undefined) data.issueDate = body.issueDate;
        if (body.credentialUrl !== undefined)
            data.credentialUrl = body.credentialUrl;

        if (Object.keys(data).length === 0) {
            api.ok({ ok: true });
            return;
        }

        const result = await prisma.certification.updateMany({
            where: { id: req.params.row_id as string, studentId: profile.id },
            data,
        });
        if (result.count === 0) throw new NotFound();
        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
