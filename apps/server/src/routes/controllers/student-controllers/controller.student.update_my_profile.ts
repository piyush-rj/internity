import type { Request, Response } from "express";
import { z } from "zod";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
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
    // Interview availability — a daily "HH:MM" 24h window.
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
    // Roles the student wants to be matched against. Dedup at write time so
    // the column doesn't drift into a multiset.
    interestedJobTitles: z.array(z.enum(JOB_TITLE_VALUES)).optional(),
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
                ...(body.interviewStartTime !== undefined && {
                    interviewStartTime: body.interviewStartTime,
                }),
                ...(body.interviewEndTime !== undefined && {
                    interviewEndTime: body.interviewEndTime,
                }),
                ...(body.interestedJobTitles !== undefined && {
                    interestedJobTitles: Array.from(
                        new Set(body.interestedJobTitles),
                    ) as JobTitle[],
                }),
            },
        });
        api.ok({ profile });
    } catch (err) {
        handleApiError(err, api);
    }
}
