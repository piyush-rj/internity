import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma, type Gender } from "../../../db.ts";

const Body = z.object({
    firstName: z.string().min(1),
    lastName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    dob: z.coerce.date().nullable().optional(),
    gender: z
        .enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"])
        .nullable()
        .optional(),
    bio: z.string().nullable().optional(),
    linkedinUrl: z
        .string()
        .url("Enter a valid LinkedIn URL")
        .nullable()
        .optional(),
    portfolioUrl: z
        .string()
        .url("Enter a valid portfolio URL")
        .nullable()
        .optional(),
    college: z.string().nullable().optional(),
    branch: z.string().nullable().optional(),
});

export default async function createMyProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const profile = await prisma.studentProfile.create({
            data: {
                userId: req.user!.id,
                firstName: body.firstName,
                lastName: body.lastName ?? null,
                phone: body.phone ?? null,
                city: body.city ?? null,
                dob: body.dob ?? null,
                gender: (body.gender ?? null) as Gender | null,
                bio: body.bio ?? null,
                linkedinUrl: body.linkedinUrl ?? null,
                portfolioUrl: body.portfolioUrl ?? null,
                college: body.college ?? null,
                branch: body.branch ?? null,
            },
        });
        api.created({ profile }, "Profile created");
    } catch (err) {
        handleApiError(err, api);
    }
}
