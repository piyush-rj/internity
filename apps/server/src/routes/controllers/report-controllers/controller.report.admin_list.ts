import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { Prisma, prisma, ReportStatus, ReportTargetType } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";

const Query = z.object({
    status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]).optional(),
    targetType: z.enum(["LISTING", "STUDENT"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export default async function adminListReports(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!isAdminUser(req.user!)) throw new Forbidden("Admin only");
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const where: Prisma.ReportWhereInput = {};
        if (q.status) where.status = q.status as ReportStatus;
        if (q.targetType) where.targetType = q.targetType as ReportTargetType;

        const [total, items] = await Promise.all([
            prisma.report.count({ where }),
            prisma.report.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (q.page - 1) * q.pageSize,
                take: q.pageSize,
                include: {
                    reporter: {
                        select: { id: true, name: true, email: true },
                    },
                    targetListing: {
                        select: {
                            id: true,
                            title: true,
                            company: {
                                select: { id: true, name: true, slug: true },
                            },
                        },
                    },
                    targetStudent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            isBanned: true,
                        },
                    },
                    resolvedBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        api.ok({ items, page: q.page, pageSize: q.pageSize, total });
    } catch (err) {
        handleApiError(err, api);
    }
}
