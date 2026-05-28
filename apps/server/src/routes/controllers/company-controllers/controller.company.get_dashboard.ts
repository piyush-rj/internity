import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { ApplicationStatus, InterviewStatus } from "../../../db.ts";
import { normalizeRole } from "../../../utils/company-roles.ts";

// Company overview dashboard for owner-level seats (gated by
// requireCompanyMember({ adminOnly: true }) on the route). Aggregates the
// company's hiring funnel, listing lifecycle breakdown, recent applicants,
// upcoming interviews, and team roster in a single fixed set of queries.
export default async function getCompanyDashboard(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const companyId = req.params.id as string;
        const now = new Date();

        // Listing lifecycle buckets — mutually exclusive by precedence
        // (takenDown > closed > paused > expired > active) so the five sum
        // to `total` with no double-counting.
        const notTakenDown = { takenDownAt: null };
        const [
            funnelRows,
            takenDown,
            closed,
            paused,
            expired,
            active,
            total,
            recentApplicants,
            upcomingInterviews,
            members,
        ] = await Promise.all([
            prisma.application.groupBy({
                by: ["status"],
                where: { listing: { companyId } },
                _count: { _all: true },
            }),
            prisma.listing.count({
                where: { companyId, takenDownAt: { not: null } },
            }),
            prisma.listing.count({
                where: { companyId, ...notTakenDown, closedAt: { not: null } },
            }),
            prisma.listing.count({
                where: {
                    companyId,
                    ...notTakenDown,
                    closedAt: null,
                    pausedAt: { not: null },
                },
            }),
            prisma.listing.count({
                where: {
                    companyId,
                    ...notTakenDown,
                    closedAt: null,
                    pausedAt: null,
                    expiresAt: { lt: now },
                },
            }),
            prisma.listing.count({
                where: {
                    companyId,
                    ...notTakenDown,
                    closedAt: null,
                    pausedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
                },
            }),
            prisma.listing.count({ where: { companyId } }),
            prisma.application.findMany({
                where: {
                    listing: { companyId },
                    status: { not: ApplicationStatus.WITHDRAWN },
                },
                orderBy: { appliedAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    status: true,
                    appliedAt: true,
                    seenAt: true,
                    student: {
                        select: { id: true, name: true, image: true },
                    },
                    listing: { select: { id: true, title: true } },
                },
            }),
            prisma.interview.count({
                where: {
                    application: { listing: { companyId } },
                    scheduledAt: { gte: now },
                    status: InterviewStatus.SCHEDULED,
                },
            }),
            prisma.companyMember.findMany({
                where: { companyId },
                orderBy: { joinedAt: "asc" },
                select: {
                    role: true,
                    customRole: true,
                    user: {
                        select: { id: true, name: true, image: true },
                    },
                },
            }),
        ]);

        const funnel = {
            APPLIED: 0,
            SHORTLISTED: 0,
            INTERVIEW: 0,
            HIRED: 0,
            REJECTED: 0,
            WITHDRAWN: 0,
            total: 0,
        };
        for (const row of funnelRows) {
            funnel[row.status] = row._count._all;
            funnel.total += row._count._all;
        }

        api.ok({
            dashboard: {
                companyId,
                funnel,
                listings: {
                    active,
                    paused,
                    closed,
                    expired,
                    takenDown,
                    total,
                },
                recentApplicants,
                interviews: { upcoming: upcomingInterviews },
                team: {
                    count: members.length,
                    members: members.map((m) => ({
                        userId: m.user.id,
                        name: m.user.name,
                        image: m.user.image,
                        role: normalizeRole(m.role),
                        customRole: m.customRole,
                    })),
                },
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
