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

        // Resolve the user's primary company membership so the plan is
        // displayed at company scope — any member can view, all payments
        // for that company are shown regardless of who made them.
        const membership = await prisma.companyMember.findFirst({
            where: { userId },
            orderBy: { joinedAt: "asc" },
            select: { companyId: true, role: true },
        });
        const companyId = membership?.companyId ?? null;

        // Fetch company premium state, all company payments, active listing
        // count, and all listing dates in parallel.
        const [company, payments, listingsUsed, allListings] =
            await Promise.all([
                companyId
                    ? prisma.company.findUnique({
                          where: { id: companyId },
                          select: {
                              isPremium: true,
                              premiumSince: true,
                              premiumUntil: true,
                              activePlanCode: true,
                          },
                      })
                    : null,

                companyId
                    ? prisma.payment.findMany({
                          where: {
                              companyId,
                              status: PaymentStatus.SUCCESS,
                          },
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
                      })
                    : // Fallback: show payments tied directly to the user for
                      // accounts that predated the company-scoped model.
                      prisma.payment.findMany({
                          where: {
                              userId,
                              companyId: null,
                              status: PaymentStatus.SUCCESS,
                          },
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

                // Active listings for the whole company (or user as fallback).
                companyId
                    ? prisma.listing.count({
                          where: {
                              companyId,
                              closedAt: null,
                              takenDownAt: null,
                              OR: [
                                  { expiresAt: null },
                                  { expiresAt: { gt: now } },
                              ],
                          },
                      })
                    : prisma.listing.count({
                          where: {
                              postedById: userId,
                              closedAt: null,
                              takenDownAt: null,
                              OR: [
                                  { expiresAt: null },
                                  { expiresAt: { gt: now } },
                              ],
                          },
                      }),

                // All listings ever posted by this company for the activity chart.
                companyId
                    ? prisma.listing.findMany({
                          where: { companyId },
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
                      })
                    : prisma.listing.findMany({
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

        // Determine plan state from the company (or fall back to the user for
        // legacy accounts that still have isPremium on the user record).
        const premiumSource =
            company ??
            (await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    isPremium: true,
                    premiumSince: true,
                    premiumUntil: true,
                    activePlanCode: true,
                },
            }));

        const premiumUntil = premiumSource?.premiumUntil ?? null;
        const isActive = !!(
            premiumSource?.isPremium &&
            premiumUntil &&
            premiumUntil > now
        );
        const daysRemaining = isActive
            ? Math.ceil(
                  (premiumUntil!.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24),
              )
            : 0;
        const planCode = premiumSource?.activePlanCode ?? null;
        const plan = planCode ? (PLANS[planCode] ?? null) : null;

        api.ok({
            currentPlan: {
                isPremium: premiumSource?.isPremium ?? false,
                isActive,
                code: planCode,
                name: plan?.name ?? null,
                since: premiumSource?.premiumSince?.toISOString() ?? null,
                until: premiumUntil?.toISOString() ?? null,
                daysRemaining,
                totalDays: plan?.durationDays ?? null,
            },
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
                    (l) => l.createdAt >= start && (!end || l.createdAt <= end),
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
