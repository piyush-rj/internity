import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { JobTitle, Prisma, WorkMode, prisma } from "../../../db.ts";
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

const Body = z
    .object({
        companyId: z.string().min(1),
        title: z.string().min(1).max(120),
        jobTitle: z.enum(JOB_TITLE_VALUES).nullable().optional(),
        customJobTitle: z.string().max(120).nullable().optional(),
        mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
        city: z.string().nullable().optional(),
        description: z.string().min(1),
        responsibilities: z.array(z.string()).default([]),
        perks: z.array(z.string()).default([]),
        preferences: z.array(z.string()).default([]),
        skillTagsRaw: z.array(z.string()).default([]),
        screeningQuestions: ScreeningQuestionsSchema.default([]),
        currency: z.string().optional(),
        // Stipend is compulsory on create. Pass 0 explicitly for unpaid roles.
        stipendMin: z.number().int().min(0, "Stipend is required."),
        stipendMax: z.number().int().min(0).nullable().optional(),
        durationMonths: z.number().int().nullable().optional(),
        durationWeeks: z.number().int().min(0).nullable().optional(),
        startDate: z.coerce.date().nullable().optional(),
        startDateLatest: z.coerce.date().nullable().optional(),
        applyBy: z.coerce.date().nullable().optional(),
        openings: z.number().int().nullable().optional(),
        partTime: z.boolean().nullable().optional(),
        ppo: z.boolean().nullable().optional(),
    })
    .refine((b) => b.stipendMax == null || b.stipendMax >= b.stipendMin, {
        message: "Max stipend must be at least the min stipend.",
        path: ["stipendMax"],
    });

function normalize(tags: readonly string[]): string[] {
    return tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
}

const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default async function createListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: body.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");
        if (!canManageListings(member.role)) {
            throw new Forbidden(
                "Your role can't post listings — ask a founder or co-founder.",
            );
        }

        // Verification is no longer a posting gate. Listings go live
        // immediately; the "Verified" badge is shown on the card / detail
        // page only when the company.verificationStatus is APPROVED.

        const expiresAt = new Date(Date.now() + LISTING_TTL_MS);

        const jobTitle = (body.jobTitle ?? null) as JobTitle | null;
        const customJobTitle =
            jobTitle === JobTitle.CUSTOM
                ? body.customJobTitle?.trim() || null
                : null;

        const data: Prisma.ListingUncheckedCreateInput = {
            companyId: body.companyId,
            postedById: req.user!.id,
            title: body.title,
            mode: body.mode as WorkMode,
            jobTitle,
            customJobTitle,
            description: body.description,
            city: body.city ?? null,
            responsibilities: body.responsibilities,
            perks: body.perks,
            preferences: body.preferences,
            skillTagsRaw: normalize(body.skillTagsRaw),
            screeningQuestions:
                body.screeningQuestions as Prisma.InputJsonValue,
            currency: body.currency ?? "INR",
            stipendMin: body.stipendMin ?? null,
            stipendMax: body.stipendMax ?? null,
            durationMonths: body.durationMonths ?? null,
            durationWeeks: body.durationWeeks ?? null,
            startDate: body.startDate ?? null,
            startDateLatest: body.startDateLatest ?? null,
            applyBy: body.applyBy ?? null,
            openings: body.openings ?? null,
            expiresAt,
            ...(body.partTime !== null && body.partTime !== undefined
                ? { partTime: body.partTime }
                : {}),
            ...(body.ppo !== null && body.ppo !== undefined
                ? { ppo: body.ppo }
                : {}),
        };
        const created = await prisma.listing.create({
            data,
            include: { company: true },
        });
        api.created({ listing: created }, "Listing created");
    } catch (err) {
        handleApiError(err, api);
    }
}
