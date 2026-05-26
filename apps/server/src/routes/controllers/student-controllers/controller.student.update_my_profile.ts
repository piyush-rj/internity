import type { Request, Response } from "express";
import { z } from "zod";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma, type Gender } from "../../../db.ts";

const Body = z.object({
    firstName: z.string().min(1).optional(),
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

export default async function updateMyProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        const existing = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true },
        });
        if (!existing) throw new NotFound("Profile not created");

        const profile = await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: {
                ...(body.firstName !== undefined && {
                    firstName: body.firstName,
                }),
                ...(body.lastName !== undefined && { lastName: body.lastName }),
                ...(body.phone !== undefined && { phone: body.phone }),
                ...(body.city !== undefined && { city: body.city }),
                ...(body.dob !== undefined && { dob: body.dob }),
                ...(body.gender !== undefined && {
                    gender: body.gender as Gender | null,
                }),
                ...(body.bio !== undefined && { bio: body.bio }),
                ...(body.linkedinUrl !== undefined && {
                    linkedinUrl: body.linkedinUrl,
                }),
                ...(body.portfolioUrl !== undefined && {
                    portfolioUrl: body.portfolioUrl,
                }),
                ...(body.college !== undefined && { college: body.college }),
                ...(body.branch !== undefined && { branch: body.branch }),
            },
        });
        api.ok({ profile });
    } catch (err) {
        handleApiError(err, api);
    }
}
