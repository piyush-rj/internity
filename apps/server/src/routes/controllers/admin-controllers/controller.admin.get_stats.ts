import type { Request, Response } from "express";
import {
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// returns platform-wide counters for the admin overview dashboard
export default async function getAdminStats(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const startOfTodayUTC = new Date();
        startOfTodayUTC.setUTCHours(0, 0, 0, 0);

        const now = new Date();
        const [totalStudents, totalFounders, totalLiveListings, applicationsToday] =
            await Promise.all([
                prisma.user.count({ where: { role: "STUDENT" } }),
                prisma.user.count({ where: { role: "EMPLOYER" } }),
                prisma.listing.count({
                    where: {
                        closedAt: null,
                        pausedAt: null,
                        takenDownAt: null,
                        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                    },
                }),
                prisma.application.count({
                    where: { appliedAt: { gte: startOfTodayUTC } },
                }),
            ]);

        api.ok({
            totalStudents,
            totalFounders,
            totalLiveListings,
            applicationsToday,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
