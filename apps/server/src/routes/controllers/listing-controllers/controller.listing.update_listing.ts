import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { JobTitle, Prisma, WorkMode, prisma } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";
import { canManageListings } from "../../../utils/company-roles.ts";
import { ScreeningQuestionsSchema } from "../../../utils/screening.ts";

const JOB_TITLE_VALUES = [
    "AI",
    "BACKEND",
    "WEB",
    "MOBILE",
    "QA",
    "DESIGN",
    "PRODUCT",
    "MARKETING",
    "CONTENT",
    "SALES",
    "DATA",
    "HR",
    "CUSTOM",
] as const;

const Body = z.object({
    title: z.string().min(1).max(120).optional(),
    jobTitle: z.enum(JOB_TITLE_VALUES).nullable().optional(),
    customJobTitle: z.string().max(120).nullable().optional(),
    mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
    city: z.string().nullable().optional(),
    description: z.string().min(1).optional(),
    responsibilities: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
    skillTagsRaw: z.array(z.string()).optional(),
    screeningQuestions: ScreeningQuestionsSchema.optional(),
    stipendMin: z.number().int().nullable().optional(),
    stipendMax: z.number().int().nullable().optional(),
    durationMonths: z.number().int().nullable().optional(),
    durationWeeks: z.number().int().min(0).nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    startDateLatest: z.coerce.date().nullable().optional(),
    applyBy: z.coerce.date().nullable().optional(),
    openings: z.number().int().nullable().optional(),
    partTime: z.boolean().nullable().optional(),
    ppo: z.boolean().nullable().optional(),
});

function normalize(tags: readonly string[]): string[] {
    return tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
}

export default async function updateListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: { companyId: true },
        });
        if (!found) throw new NotFound();
        // admins can edit any listing for moderation
        if (!isAdminUser(req.user!)) {
            const member = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: {
                        companyId: found.companyId,
                        userId: req.user!.id,
                    },
                },
            });
            if (!member) throw new Forbidden("Not a member of this company");
            if (!canManageListings(member.role)) {
                throw new Forbidden(
                    "Your role can't edit listings — ask a founder or co-founder.",
                );
            }
        }

        const body = Body.parse(req.body);

        const data: Prisma.ListingUpdateInput = {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.jobTitle !== undefined && {
                jobTitle: (body.jobTitle ?? null) as JobTitle | null,
            }),
            ...(body.customJobTitle !== undefined && {
                customJobTitle: body.customJobTitle?.trim() || null,
            }),
            ...(body.mode !== undefined && { mode: body.mode as WorkMode }),
            ...(body.city !== undefined && { city: body.city }),
            ...(body.description !== undefined && {
                description: body.description,
            }),
            ...(body.responsibilities !== undefined && {
                responsibilities: body.responsibilities ?? [],
            }),
            ...(body.perks !== undefined && { perks: body.perks ?? [] }),
            ...(body.preferences !== undefined && {
                preferences: body.preferences ?? [],
            }),
            ...(body.skillTagsRaw !== undefined && {
                skillTagsRaw: normalize(body.skillTagsRaw ?? []),
            }),
            ...(body.screeningQuestions !== undefined && {
                screeningQuestions:
                    body.screeningQuestions as Prisma.InputJsonValue,
            }),
            ...(body.stipendMin !== undefined && {
                stipendMin: body.stipendMin,
            }),
            ...(body.stipendMax !== undefined && {
                stipendMax: body.stipendMax,
            }),
            ...(body.durationMonths !== undefined && {
                durationMonths: body.durationMonths,
            }),
            ...(body.durationWeeks !== undefined && {
                durationWeeks: body.durationWeeks,
            }),
            ...(body.startDate !== undefined && { startDate: body.startDate }),
            ...(body.startDateLatest !== undefined && {
                startDateLatest: body.startDateLatest,
            }),
            ...(body.applyBy !== undefined && { applyBy: body.applyBy }),
            ...(body.openings !== undefined && { openings: body.openings }),
            ...(body.partTime !== undefined &&
                body.partTime !== null && { partTime: body.partTime }),
        };

        const updated = await prisma.listing.update({
            where: { id },
            data,
            include: { company: true },
        });
        api.ok({ listing: updated });
    } catch (err) {
        handleApiError(err, api);
    }
}
