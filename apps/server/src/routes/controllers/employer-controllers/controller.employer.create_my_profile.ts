import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().nullable().optional(),
    phone: z.string().min(1, "Phone is required"),
    jobTitle: z.string().min(1, "Your role at the company is required"),
    linkedinUrl: z
        .string()
        .url("Enter a valid LinkedIn URL")
        .nullable()
        .optional(),
    country: z.string().min(1, "Country is required"),
});

export default async function createMyEmployerProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const profile = await prisma.employerProfile.upsert({
            where: { userId: req.user!.id },
            create: {
                userId: req.user!.id,
                firstName: body.firstName,
                lastName: body.lastName ?? null,
                phone: body.phone,
                jobTitle: body.jobTitle,
                linkedinUrl: body.linkedinUrl ?? null,
                country: body.country,
            },
            update: {
                firstName: body.firstName,
                lastName: body.lastName ?? null,
                phone: body.phone,
                jobTitle: body.jobTitle,
                linkedinUrl: body.linkedinUrl ?? null,
                country: body.country,
            },
        });
        api.created({ profile }, "Profile saved");
    } catch (err) {
        handleApiError(err, api);
    }
}
