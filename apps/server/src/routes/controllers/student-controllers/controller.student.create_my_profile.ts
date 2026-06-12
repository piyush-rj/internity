import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma, type Gender, type JobTitle } from "../../../db.ts";

const JOB_TITLE_VALUES = [
    "AI",
    "BACKEND",
    "WEB",
    "MOBILE",
    "QA",
    "DESIGN",
    "PRODUCT",
    "RESEARCHER",
    "MARKETING",
    "CONTENT",
    "VIDEO",
    "SALES",
    "SOCIAL",
    "DATA",
    "HR",
    "CUSTOM",
] as const;

// "HH:MM" 24-hour, e.g. 09:00 or 17:30.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    interviewStartTime: z
        .string()
        .regex(TIME_RE, "Enter a valid time")
        .nullable()
        .optional(),
    interviewEndTime: z
        .string()
        .regex(TIME_RE, "Enter a valid time")
        .nullable()
        .optional(),
    interestedJobTitles: z.array(z.enum(JOB_TITLE_VALUES)).optional(),
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
                interviewStartTime: body.interviewStartTime ?? null,
                interviewEndTime: body.interviewEndTime ?? null,
                interestedJobTitles: body.interestedJobTitles
                    ? (Array.from(
                          new Set(body.interestedJobTitles),
                      ) as JobTitle[])
                    : [],
            },
        });
        api.created({ profile }, "Profile created");
    } catch (err) {
        handleApiError(err, api);
    }
}
