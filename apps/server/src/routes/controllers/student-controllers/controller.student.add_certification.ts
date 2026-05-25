import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, InvalidRequest, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1),
    issuer: z.string().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    credentialUrl: z.string().url().nullable().optional(),
});

export default async function addCertification(
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
        if (!profile) throw new InvalidRequest("Create your profile first");
        const row = await prisma.certification.create({
            data: {
                studentId: profile.id,
                name: body.name,
                issuer: body.issuer ?? null,
                issueDate: body.issueDate ?? null,
                credentialUrl: body.credentialUrl ?? null,
            },
        });
        api.created({ certification: row });
    } catch (err) {
        handleApiError(err, api);
    }
}
