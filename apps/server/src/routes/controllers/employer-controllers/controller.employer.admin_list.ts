import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { Prisma, prisma } from "../../../db.ts";

const Query = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Admin-only list of founders (every user with an EmployerProfile). Search
 * spans firstName/lastName/jobTitle, the user's name/email, and the
 * company name they belong to. Used by /admin/founders.
 */
export default async function adminListFounders(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const where: Prisma.EmployerProfileWhereInput = {};
        if (q.q && q.q.trim()) {
            const needle = q.q.trim();
            where.OR = [
                { firstName: { contains: needle, mode: "insensitive" } },
                { lastName: { contains: needle, mode: "insensitive" } },
                { jobTitle: { contains: needle, mode: "insensitive" } },
                { phone: { contains: needle, mode: "insensitive" } },
                {
                    user: {
                        OR: [
                            { name: { contains: needle, mode: "insensitive" } },
                            {
                                email: {
                                    contains: needle,
                                    mode: "insensitive",
                                },
                            },
                            {
                                companyMemberships: {
                                    some: {
                                        company: {
                                            OR: [
                                                {
                                                    name: {
                                                        contains: needle,
                                                        mode: "insensitive",
                                                    },
                                                },
                                                {
                                                    slug: {
                                                        contains: needle,
                                                        mode: "insensitive",
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ];
        }

        const [total, items] = await Promise.all([
            prisma.employerProfile.count({ where }),
            prisma.employerProfile.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            createdAt: true,
                            isBanned: true,
                            companyMemberships: {
                                take: 1,
                                orderBy: { joinedAt: "asc" },
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
                            },
                        },
                    },
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
