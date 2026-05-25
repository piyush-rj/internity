import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import {
    CompanyVerificationStatus,
    Prisma,
    prisma,
} from "../../../db.ts";

const Query = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Admin-only list of companies, filtered by verification status and free-text
 * search across name / slug / website / linkedin / city / member emails+names.
 * Returns a paginated envelope plus per-row counts that the admin queue UI
 * uses (live listing count, member count).
 */
export default async function adminListCompanies(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const where: Prisma.CompanyWhereInput = {};
        if (q.status)
            where.verificationStatus = q.status as CompanyVerificationStatus;
        if (q.q && q.q.trim()) {
            const needle = q.q.trim();
            where.OR = [
                { name: { contains: needle, mode: "insensitive" } },
                { slug: { contains: needle, mode: "insensitive" } },
                { website: { contains: needle, mode: "insensitive" } },
                { linkedinUrl: { contains: needle, mode: "insensitive" } },
                { city: { contains: needle, mode: "insensitive" } },
                { industry: { contains: needle, mode: "insensitive" } },
                {
                    members: {
                        some: {
                            user: {
                                OR: [
                                    {
                                        email: {
                                            contains: needle,
                                            mode: "insensitive",
                                        },
                                    },
                                    {
                                        name: {
                                            contains: needle,
                                            mode: "insensitive",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ];
        }

        // PENDING first (most actionable), then most-recently submitted.
        const orderBy: Prisma.CompanyOrderByWithRelationInput[] = q.status
            ? [{ submittedAt: "desc" }, { createdAt: "desc" }]
            : [{ submittedAt: "desc" }];

        const [total, items] = await Promise.all([
            prisma.company.count({ where }),
            prisma.company.findMany({
                where,
                orderBy,
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    _count: {
                        select: {
                            members: true,
                            listings: { where: { closedAt: null } },
                        },
                    },
                    members: {
                        take: 1,
                        orderBy: { joinedAt: "asc" },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true,
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
