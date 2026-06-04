import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { PLANS } from "../../../core/plans.ts";
import { PaymentStatus, prisma } from "../../../db.ts";

export default async function listMyPayments(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const now = new Date();

        const [user, payments, listingsUsed, allListings] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    isPremium: true,
                    premiumSince: true,
                    premiumUntil: true,
                    activePlanCode: true,
                },
            }),
            prisma.payment.findMany({
                where: { userId, status: PaymentStatus.SUCCESS },
                orderBy: { createdAt: "desc" },
                include: {
                    cancellationRequest: {
                        select: {
                            id: true,
                            paymentId: true,
                            reason: true,
                            otherText: true,
                            status: true,
                            listingsUsedAtRequest: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            // Listings the user currently has occupying a slot: live or paused,
            // i.e. not closed, not taken down, and not past expiry. This is what
            // a plan's listingLimit is measured against.
            prisma.listing.count({
                where: {
                    postedById: userId,
                    closedAt: null,
                    takenDownAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            }),
            // All listings ever posted by this user — used for the posting
            // activity chart and per-day listing cards.
            prisma.listing.findMany({
                where: { postedById: userId },
                select: {
                    id: true,
                    title: true,
                    city: true,
                    mode: true,
                    jobTitle: true,
                    closedAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            }),
        ]);

        const premiumUntil = user?.premiumUntil ?? null;
        const isActive = !!(
            user?.isPremium &&
            premiumUntil &&
            premiumUntil > now
        );
        const daysRemaining = isActive
            ? Math.ceil(
                  (premiumUntil!.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24),
              )
            : 0;
        const planCode = user?.activePlanCode ?? null;
        const plan = planCode ? (PLANS[planCode] ?? null) : null;

        api.ok({
            currentPlan: {
                isPremium: user?.isPremium ?? false,
                isActive,
                code: planCode,
                name: plan?.name ?? null,
                since: user?.premiumSince?.toISOString() ?? null,
                until: premiumUntil?.toISOString() ?? null,
                daysRemaining,
                totalDays: plan?.durationDays ?? null,
            },
            // Real usage tied to plan features. listingLimit null = unlimited
            // (Yearly) or no active plan; listingsUsed is the live count above.
            usage: {
                listingsUsed,
                listingLimit: plan?.listingLimit ?? null,
            },
            payments: payments.map((p) => {
                const planDef = PLANS[p.planCode];
                const start = p.createdAt;
                const end = planDef
                    ? new Date(
                          start.getTime() +
                              planDef.durationDays * 24 * 60 * 60 * 1000,
                      )
                    : null;
                const listingsPosted = allListings.filter(
                    (l) =>
                        l.createdAt >= start && (!end || l.createdAt <= end),
                ).length;
                return {
                    id: p.id,
                    planCode: p.planCode,
                    planName: planDef?.name ?? p.planCode,
                    amount: p.amount,
                    currency: p.currency,
                    status: p.status,
                    razorpayPaymentId: p.razorpayPaymentId,
                    razorpayOrderId: p.razorpayOrderId,
                    createdAt: start.toISOString(),
                    validUntil: end?.toISOString() ?? null,
                    listingsPosted,
                    listingLimit: planDef?.listingLimit ?? null,
                    cancellationRequest: p.cancellationRequest
                        ? {
                              id: p.cancellationRequest.id,
                              paymentId: p.cancellationRequest.paymentId,
                              reason: p.cancellationRequest.reason,
                              otherText: p.cancellationRequest.otherText,
                              status: p.cancellationRequest.status,
                              listingsUsedAtRequest:
                                  p.cancellationRequest.listingsUsedAtRequest,
                              createdAt:
                                  p.cancellationRequest.createdAt.toISOString(),
                          }
                        : null,
                };
            }),
            listingActivity: allListings.map((l) => ({
                id: l.id,
                title: l.title,
                city: l.city,
                mode: l.mode,
                jobTitle: l.jobTitle,
                closedAt: l.closedAt?.toISOString() ?? null,
                createdAt: l.createdAt.toISOString(),
            })),
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
