import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { ListingType, Prisma, WorkMode, prisma } from "../../../db.ts";

const Body = z.object({
    type: z.enum(["INTERNSHIP", "JOB"]).optional(),
    title: z.string().min(1).optional(),
    mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
    city: z.string().nullable().optional(),
    description: z.string().min(1).optional(),
    responsibilities: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
    skillTagsRaw: z.array(z.string()).optional(),
    screeningQuestions: z
        .array(z.string().min(1).max(200))
        .max(5, "Up to 5 screening questions")
        .optional(),
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
        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: found.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");

        const body = Body.parse(req.body);
        const data: Prisma.ListingUpdateInput = {
            ...(body.type !== undefined && { type: body.type as ListingType }),
            ...(body.title !== undefined && { title: body.title }),
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
                screeningQuestions: body.screeningQuestions
                    .map((q) => q.trim())
                    .filter(Boolean),
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
            ...(body.startDate !== undefined && { startDate: body.startDate }),
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
