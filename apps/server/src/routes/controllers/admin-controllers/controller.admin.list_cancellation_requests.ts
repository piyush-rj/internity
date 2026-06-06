import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { PLANS } from "../../../core/plans.ts";

const Query = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export default async function listCancellationRequests(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);
        const where = q.status ? { status: q.status } : {};

        const [total, items] = await Promise.all([
            prisma.cancellationRequest.count({ where }),
            prisma.cancellationRequest.findMany({
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
                            isPremium: true,
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
                    payment: {
                        select: {
                            id: true,
                            planCode: true,
                            amount: true,
                            currency: true,
                            createdAt: true,
                        },
                    },
                },
            }),
        ]);

        api.ok({
            items: items.map((r) => ({
                id: r.id,
                reason: r.reason,
                otherText: r.otherText,
                status: r.status,
                listingsUsedAtRequest: r.listingsUsedAtRequest,
                adminNote: r.adminNote,
                resolvedAt: r.resolvedAt?.toISOString() ?? null,
                createdAt: r.createdAt.toISOString(),
                user: r.user,
                payment: {
                    ...r.payment,
                    planName:
                        PLANS[r.payment.planCode]?.name ?? r.payment.planCode,
                    createdAt: r.payment.createdAt.toISOString(),
                },
            })),
            total,
            page: q.page,
            pageSize: q.pageSize,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
