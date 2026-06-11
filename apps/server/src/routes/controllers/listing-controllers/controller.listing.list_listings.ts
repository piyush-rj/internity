import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { JobTitle, Prisma, WorkMode, prisma } from "../../../db.ts";

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

const Query = z.object({
    q: z.string().optional(),
    city: z.string().optional(),
    mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
    jobTitle: z.enum(JOB_TITLE_VALUES).optional(),
    // Comma-separated list of job titles — used by the student's
    // "Recommended internships" feed to match several related roles at once.
    jobTitles: z.string().optional(),
    // Free-text custom role — OR-combined with jobTitles, matched against the
    // listing title + custom job-title.
    customRole: z.string().optional(),
    skills: z.string().optional(),
    minSalary: z.coerce.number().int().optional(),
    currency: z.string().optional(),
    durationMax: z.coerce.number().int().optional(),
    partTime: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

function normalize(tags: readonly string[]): string[] {
    return tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
}

export default async function listListings(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const where: Prisma.ListingWhereInput = {
            closedAt: null,
            takenDownAt: null,
            pausedAt: null,
            postedBy: { isBanned: false, deletedAt: null },
            AND: [
                {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
                {
                    OR: [{ applyBy: null }, { applyBy: { gt: new Date() } }],
                },
            ],
        };
        if (q.mode) where.mode = q.mode as WorkMode;

        // Role filter: predefined titles (jobTitles, may include CUSTOM) and an
        // optional free-text custom role are OR-combined — a listing shows if
        // its role is any of the picked titles, OR its title/customJobTitle
        // matches the typed text. When custom text is present, CUSTOM is
        // dropped from the plain IN set so the text drives the match (rather
        // than blanket-matching every custom-role listing).
        const allowed = new Set<string>(JOB_TITLE_VALUES);
        const titles = (q.jobTitles ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t !== "CUSTOM" && allowed.has(t));
        // Custom roles are newline-joined free text; each is matched against
        // the title + customJobTitle.
        const customRoles = (q.customRole ?? "")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 20);

        const roleOr: Prisma.ListingWhereInput[] = [];
        if (titles.length > 0) {
            roleOr.push({ jobTitle: { in: titles as JobTitle[] } });
        }
        for (const role of customRoles) {
            roleOr.push({ title: { contains: role, mode: "insensitive" } });
            roleOr.push({
                customJobTitle: { contains: role, mode: "insensitive" },
            });
        }
        if (roleOr.length > 0) {
            (where.AND as Prisma.ListingWhereInput[]).push({ OR: roleOr });
        } else if (q.jobTitle) {
            // Back-compat: legacy single jobTitle param.
            where.jobTitle = q.jobTitle as JobTitle;
        }
        if (q.city) where.city = { contains: q.city, mode: "insensitive" };
        if (q.q && q.q.trim()) {
            const needle = q.q.trim();
            where.OR = [
                { title: { contains: needle, mode: "insensitive" } },
                {
                    customJobTitle: {
                        contains: needle,
                        mode: "insensitive",
                    },
                },
                {
                    company: {
                        name: { contains: needle, mode: "insensitive" },
                    },
                },
                { skillTagsRaw: { has: needle.toLowerCase() } },
            ];
        }
        if (q.minSalary !== undefined) where.stipendMax = { gte: q.minSalary };
        if (q.currency) where.currency = q.currency;
        if (q.durationMax !== undefined) {
            where.durationMonths = { lte: q.durationMax };
        }
        if (q.partTime !== undefined) where.partTime = q.partTime === "true";
        if (q.skills) {
            const tags = normalize(q.skills.split(","));
            if (tags.length > 0) where.skillTagsRaw = { hasSome: tags };
        }

        const [total, items] = await Promise.all([
            prisma.listing.count({ where }),
            prisma.listing.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            logoUrl: true,
                            verificationStatus: true,
                        },
                    },
                },
            }),
        ]);

        api.ok({ items, page: q.page, pageSize: q.pageSize, total });
    } catch (err) {
        handleApiError(err, api);
    }
}
