import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { Prisma, prisma } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";

const Query = z.object({
    q: z.string().optional(),
    banned: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export default async function adminListStudents(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!isAdminUser(req.user!)) throw new Forbidden("Admin only");
        const parsed = Query.safeParse(req.query);
        if (!parsed.success) throw new InvalidRequest("Invalid query");
        const q = parsed.data;

        const userFilter: Prisma.UserWhereInput = { deletedAt: null };
        if (q.banned !== undefined) {
            userFilter.isBanned = q.banned === "true";
        }
        const where: Prisma.StudentProfileWhereInput = { user: userFilter };
        if (q.q && q.q.trim()) {
            const needle = q.q.trim();
            where.OR = [
                { firstName: { contains: needle, mode: "insensitive" } },
                { lastName: { contains: needle, mode: "insensitive" } },
                { city: { contains: needle, mode: "insensitive" } },
                { college: { contains: needle, mode: "insensitive" } },
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
                        ],
                    },
                },
            ];
        }

        const [total, items] = await Promise.all([
            prisma.studentProfile.count({ where }),
            prisma.studentProfile.findMany({
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
                            isBanned: true,
                            banReason: true,
                            createdAt: true,
                        },
                    },
                    _count: { select: { educations: true } },
                },
            }),
        ]);

        const applicationCounts = await prisma.application.groupBy({
            by: ["studentId"],
            _count: true,
            where: { studentId: { in: items.map((i) => i.user.id) } },
        });
        const counts = new Map(
            applicationCounts.map((c) => [c.studentId, c._count] as const),
        );

        const enriched = items.map((s) => ({
            ...s,
            applicationsCount: counts.get(s.user.id) ?? 0,
        }));

        api.ok({ items: enriched, page: q.page, pageSize: q.pageSize, total });
    } catch (err) {
        handleApiError(err, api);
    }
}
