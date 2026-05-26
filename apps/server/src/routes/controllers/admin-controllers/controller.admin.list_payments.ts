import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    status: z.enum(["CREATED", "SUCCESS", "FAILED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /admin/payments — admin-only paginated list of every payment row.
 * Joins the founder + their primary company so the table can show who
 * paid for what without N+1 lookups on the client.
 */
export default async function listPayments(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);
        const where = q.status ? { status: q.status } : {};

        const [total, items] = await Promise.all([
            prisma.payment.count({ where }),
            prisma.payment.findMany({
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
                            companyMemberships: {
                                take: 1,
                                orderBy: { joinedAt: "asc" },
                                select: {
                                    company: {
                                        select: {
                                            id: true,
                                            name: true,
                                            slug: true,
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
        handleApiError(err, api);
    }
}
