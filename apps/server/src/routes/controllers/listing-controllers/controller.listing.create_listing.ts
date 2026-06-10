import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import {
    JobTitle,
    NotificationType,
    Prisma,
    WorkMode,
    prisma,
} from "../../../db.ts";
import { canManageListings } from "../../../utils/company-roles.ts";
import { ScreeningQuestionsSchema } from "../../../utils/screening.ts";
import { notify } from "../../../services/notifications.ts";

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
        // Stipend is compulsory and must be greater than 0 (unpaid roles are
        // not allowed).
        stipendMin: z.number().int().min(1, "Stipend cannot be 0."),
        stipendMax: z.number().int().min(1).nullable().optional(),
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

        const [member, company] = await Promise.all([
            prisma.companyMember.findUnique({
                where: {
                    companyId_userId: {
                        companyId: body.companyId,
                        userId: req.user!.id,
                    },
                },
            }),
            prisma.company.findUnique({
                where: { id: body.companyId },
                select: {
                    isPremium: true,
                    freeListingUsed: true,
                    freeListingExpiresAt: true,
                },
            }),
        ]);

        if (!member) throw new Forbidden("Not a member of this company");
        if (!canManageListings(member.role)) {
            throw new Forbidden(
                "Your role can't post listings — ask a founder or co-founder.",
            );
        }

        // Free slots priority: default 1-free → admin-granted quota → paid subscription.
        // The default free listing is always consumed first; admin grants act as
        // top-ups after the default is gone.
        const now = new Date();
        const activeGrants = await prisma.freePostingGrant.findMany({
            where: {
                companyId: body.companyId,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            orderBy: { createdAt: "asc" },
            select: { id: true, grantedPostings: true, usedPostings: true },
        });
        const grant =
            activeGrants.find((g) => g.usedPostings < g.grantedPostings) ??
            null;

        // Helper: notify the company's FOUNDER_OWNER about free-slot usage.
        async function notifyFounder(
            title: string,
            message: string,
        ): Promise<void> {
            const founder = await prisma.companyMember.findFirst({
                where: { companyId: body.companyId, role: "FOUNDER_OWNER" },
                select: { userId: true },
            });
            if (founder) {
                await notify({
                    userId: founder.userId,
                    type: NotificationType.FREE_POSTING_GRANTED,
                    title,
                    body: message,
                    link: "/home/manage-listings",
                });
            }
        }

        if (!company?.freeListingUsed) {
            // Check if the default free listing offer has expired.
            if (
                company?.freeListingExpiresAt &&
                company.freeListingExpiresAt < now
            ) {
                throw new Forbidden(
                    "Your free listing offer has expired. Subscribe to a plan to post.",
                );
            }
            // Consume the default one-time free listing every company gets.
            await prisma.company.update({
                where: { id: body.companyId },
                data: { freeListingUsed: true },
            });
            await notifyFounder(
                "Free listing used",
                "Your company's one free listing has been posted. Subscribe to a plan to post more.",
            );
        } else if (grant) {
            // Default free listing already used — consume one admin-granted slot.
            const updated = await prisma.freePostingGrant.update({
                where: { id: grant.id },
                data: { usedPostings: { increment: 1 } },
                select: { grantedPostings: true, usedPostings: true },
            });
            const remaining = grant.grantedPostings - updated.usedPostings;
            await notifyFounder(
                "Free posting slot used",
                `Your company used 1 admin-granted free posting. ${remaining} slot${remaining === 1 ? "" : "s"} remaining.`,
            );
        } else if (!company?.isPremium) {
            // No free slots left and no paid plan — block.
            throw new Forbidden(
                "Your company has used its free listing. Subscribe to a plan to post more.",
            );
        }
        // else: isPremium and no free slots — allow via paid subscription.

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
