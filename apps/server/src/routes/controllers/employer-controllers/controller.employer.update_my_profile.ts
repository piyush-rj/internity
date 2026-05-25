import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
});

export default async function updateMyEmployerProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const existing = await prisma.employerProfile.findUnique({
            where: { userId: req.user!.id },
            select: { userId: true },
        });
        if (!existing) throw new NotFound();

        const profile = await prisma.employerProfile.update({
            where: { userId: req.user!.id },
            data: {
                ...(body.firstName !== undefined && {
                    firstName: body.firstName,
                }),
                ...(body.lastName !== undefined && { lastName: body.lastName }),
                ...(body.phone !== undefined && { phone: body.phone }),
                ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
            },
        });
        api.ok({ profile });
    } catch (err) {
        handleApiError(err, api);
    }
}
