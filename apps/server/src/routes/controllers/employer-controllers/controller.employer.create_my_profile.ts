import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    firstName: z.string().min(1),
    lastName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
});

export default async function createMyEmployerProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const profile = await prisma.employerProfile.create({
            data: {
                userId: req.user!.id,
                firstName: body.firstName,
                lastName: body.lastName ?? null,
                phone: body.phone ?? null,
                jobTitle: body.jobTitle ?? null,
            },
        });
        api.created({ profile }, "Profile created");
    } catch (err) {
        handleApiError(err, api);
    }
}
