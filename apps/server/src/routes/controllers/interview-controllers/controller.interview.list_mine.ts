import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Query = z.object({
    role: z.enum(["candidate", "host", "all"]).optional(),
    status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
});

// lists caller interviews split into upcoming and past
export default async function listMyInterviews(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = Query.parse(req.query);
        const userId = req.user!.id;

        const where: {
            OR?: Array<{ candidateId?: string; hostId?: string }>;
            candidateId?: string;
            hostId?: string;
            status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
        } = {};

        if (q.role === "candidate") where.candidateId = userId;
        else if (q.role === "host") where.hostId = userId;
        else {
            where.OR = [{ candidateId: userId }, { hostId: userId }];
        }

        if (q.status) where.status = q.status;

        const items = await prisma.interview.findMany({
            where,
            orderBy: { scheduledAt: "desc" },
            include: {
                application: {
                    select: {
                        id: true,
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                jobTitle: true,
                                company: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        logoUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
                host: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        deletedAt: true,
                    },
                },
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        deletedAt: true,
                    },
                },
            },
        });

        const now = Date.now();
        const upcoming = items.filter(
            (i) =>
                i.status === "SCHEDULED" &&
                new Date(i.scheduledAt).getTime() >= now - 60 * 60 * 1000,
        );
        const past = items.filter((i) => !upcoming.includes(i));
        upcoming.sort(
            (a, b) =>
                new Date(a.scheduledAt).getTime() -
                new Date(b.scheduledAt).getTime(),
        );

        api.ok({ upcoming, past });
    } catch (err) {
        handleApiError(err, api);
    }
}
