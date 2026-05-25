import type { Request, Response } from "express";
import {
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * Platform-wide counters for the admin overview dashboard.
 *
 *   totalStudents     — User.role === STUDENT
 *   totalFounders     — User.role === EMPLOYER
 *   totalLiveListings — same "live" predicate as the public browse: open,
 *                       not paused, not taken down, not past expiry.
 *   applicationsToday — applications with appliedAt >= start of today (UTC).
 *
 * Counts run in parallel — even the slow ones complete in tens of ms with a
 * properly-indexed table; the dashboard re-fetches on every visit so this
 * doesn't need to be cached.
 */
export default async function getAdminStats(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        // Start of today in UTC. Cleaner than local time, and the dashboard
        // is admin-facing — UTC is the right anchor.
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
