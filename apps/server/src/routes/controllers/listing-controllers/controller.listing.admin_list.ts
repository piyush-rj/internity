import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { Prisma, prisma } from "../../../db.ts";

const Query = z.object({
    state: z.enum(["live", "closed", "takendown", "all"]).default("live"),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// admin-only paginated list of all listings with state filter and search
export default async function adminListListings(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const where: Prisma.ListingWhereInput = {};
        if (q.state === "live")
            where.AND = [{ closedAt: null }, { takenDownAt: null }];
        else if (q.state === "closed")
            where.AND = [{ closedAt: { not: null } }, { takenDownAt: null }];
        else if (q.state === "takendown") where.takenDownAt = { not: null };

        if (q.q && q.q.trim()) {
            const needle = q.q.trim();
            const lower = needle.toLowerCase();
            where.OR = [
                { title: { contains: needle, mode: "insensitive" } },
                {
                    company: {
                        OR: [
                            { name: { contains: needle, mode: "insensitive" } },
                            { slug: { contains: needle, mode: "insensitive" } },
                        ],
                    },
                },
                { skillTagsRaw: { has: lower } },
                {
                    postedBy: {
                        OR: [
                            { name: { contains: needle, mode: "insensitive" } },
                            {
                                email: {
                                    contains: needle,
                                    mode: "insensitive",
                                },
                            },
                            {
                                employerProfile: {
                                    OR: [
                                        {
                                            firstName: {
                                                contains: needle,
                                                mode: "insensitive",
                                            },
                                        },
                                        {
                                            lastName: {
                                                contains: needle,
                                                mode: "insensitive",
                                            },
                                        },
                                        {
                                            jobTitle: {
                                                contains: needle,
                                                mode: "insensitive",
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ];
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
                    postedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                    _count: { select: { applications: true } },
                },
            }),
        ]);

        api.ok({ items, page: q.page, pageSize: q.pageSize, total });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid query");
            return;
        }
        console.error(err);
        api.internalError();
    }
}
