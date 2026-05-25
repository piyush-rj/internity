import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, Forbidden, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import {
    CompanyVerificationStatus,
    ListingType,
    Prisma,
    WorkMode,
    prisma,
} from "../../../db.ts";

const Body = z.object({
    companyId: z.string().min(1),
    type: z.enum(["INTERNSHIP", "JOB"]),
    title: z.string().min(1),
    mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
    city: z.string().nullable().optional(),
    description: z.string().min(1),
    responsibilities: z.array(z.string()).default([]),
    perks: z.array(z.string()).default([]),
    preferences: z.array(z.string()).default([]),
    skillTagsRaw: z.array(z.string()).default([]),
    // 0-5 short questions, each capped at 200 chars to keep apply screens
    // honest with the "no long forms" principle.
    screeningQuestions: z
        .array(z.string().min(1).max(200))
        .max(5, "Up to 5 screening questions")
        .default([]),
    stipendMin: z.number().int().nullable().optional(),
    stipendMax: z.number().int().nullable().optional(),
    durationMonths: z.number().int().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    applyBy: z.coerce.date().nullable().optional(),
    openings: z.number().int().nullable().optional(),
    partTime: z.boolean().nullable().optional(),
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
            include: {
                company: {
                    select: { verificationStatus: true },
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");
        if (
            member.company.verificationStatus !==
            CompanyVerificationStatus.APPROVED
        ) {
            throw new Forbidden(
                "Your company isn't approved by admin yet. You'll be able to post once it is.",
            );
        }

        // Listings live for 30 days. The founder can renew to bump this
        // forward; we cap visibility on the public surfaces using this field.
        const expiresAt = new Date(Date.now() + LISTING_TTL_MS);

        const data: Prisma.ListingUncheckedCreateInput = {
            companyId: body.companyId,
            postedById: req.user!.id,
            type: body.type as ListingType,
            title: body.title,
            mode: body.mode as WorkMode,
            description: body.description,
            city: body.city ?? null,
            responsibilities: body.responsibilities,
            perks: body.perks,
            preferences: body.preferences,
            skillTagsRaw: normalize(body.skillTagsRaw),
            screeningQuestions: body.screeningQuestions
                .map((q) => q.trim())
                .filter(Boolean),
            stipendMin: body.stipendMin ?? null,
            stipendMax: body.stipendMax ?? null,
            durationMonths: body.durationMonths ?? null,
            startDate: body.startDate ?? null,
            applyBy: body.applyBy ?? null,
            openings: body.openings ?? null,
            expiresAt,
            ...(body.partTime !== null && body.partTime !== undefined
                ? { partTime: body.partTime }
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
