import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { PLANS } from "../../../core/plans.ts";

export default async function getMyEmployerProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const [profile, memberships] = await Promise.all([
            prisma.employerProfile.findUnique({
                where: { userId: req.user!.id },
            }),
            prisma.companyMember.findMany({
                where: { userId: req.user!.id },
                include: {
                    company: {
                        include: {
                            freePostingGrants: { where: { isActive: true } },
                        },
                    },
                },
            }),
        ]);

        // Compute listing quota for the primary company.
        const primaryCompany = memberships[0]?.company ?? null;
        let listingQuota: {
            remaining: number | null;
            total: number | null;
        } | null = null;

        if (primaryCompany) {
            const grants = primaryCompany.freePostingGrants ?? [];
            const freeRemaining = primaryCompany.freeListingUsed ? 0 : 1;
            const grantsRemaining = grants.reduce(
                (sum, g) => sum + (g.grantedPostings - g.usedPostings),
                0,
            );
            const grantsTotal = grants.reduce(
                (sum, g) => sum + g.grantedPostings,
                0,
            );

            if (primaryCompany.isPremium && primaryCompany.activePlanCode) {
                const plan = PLANS[primaryCompany.activePlanCode] ?? null;
                const planLimit = plan?.listingLimit ?? null;

                if (planLimit === null) {
                    // Unlimited plan (e.g. YEARLY) — no meaningful dial.
                    listingQuota = { remaining: null, total: null };
                } else {
                    const now = new Date();
                    const activeListings = await prisma.listing.count({
                        where: {
                            companyId: primaryCompany.id,
                            closedAt: null,
                            takenDownAt: null,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: now } },
                            ],
                        },
                    });
                    const premiumRemaining = Math.max(
                        0,
                        planLimit - activeListings,
                    );
                    listingQuota = {
                        remaining:
                            freeRemaining + grantsRemaining + premiumRemaining,
                        total: 1 + grantsTotal + planLimit,
                    };
                }
            } else {
                listingQuota = {
                    remaining: freeRemaining + grantsRemaining,
                    total: 1 + grantsTotal,
                };
            }
        }

        api.ok({ profile, memberships, listingQuota });
    } catch (err) {
        handleApiError(err, api);
    }
}
