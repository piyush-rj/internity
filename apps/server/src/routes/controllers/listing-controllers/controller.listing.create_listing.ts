import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    Forbidden,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { ListingType, Prisma, WorkMode, prisma } from "../../../db.ts";

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
            stipendMin: body.stipendMin ?? null,
            stipendMax: body.stipendMax ?? null,
            durationMonths: body.durationMonths ?? null,
            startDate: body.startDate ?? null,
            applyBy: body.applyBy ?? null,
            openings: body.openings ?? null,
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
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
