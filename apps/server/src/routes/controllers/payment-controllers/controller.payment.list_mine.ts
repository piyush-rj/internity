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

        const [user, payments] = await Promise.all([
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
            }),
        ]);

        const now = new Date();
        const premiumUntil = user?.premiumUntil ?? null;
        const isActive = !!(user?.isPremium && premiumUntil && premiumUntil > now);
        const daysRemaining = isActive
            ? Math.ceil((premiumUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        api.ok({
            currentPlan: {
                isPremium: user?.isPremium ?? false,
                isActive,
                code: user?.activePlanCode ?? null,
                name: user?.activePlanCode ? (PLANS[user.activePlanCode]?.name ?? null) : null,
                since: user?.premiumSince?.toISOString() ?? null,
                until: premiumUntil?.toISOString() ?? null,
                daysRemaining,
                totalDays: (() => {
                    if (!user?.activePlanCode) return null;
                    return PLANS[user.activePlanCode]?.durationDays ?? null;
                })(),
            },
            payments: payments.map((p) => ({
                id: p.id,
                planCode: p.planCode,
                planName: PLANS[p.planCode]?.name ?? p.planCode,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                razorpayPaymentId: p.razorpayPaymentId,
                razorpayOrderId: p.razorpayOrderId,
                createdAt: p.createdAt.toISOString(),
                validUntil: (() => {
                    const plan = PLANS[p.planCode];
                    if (!plan) return null;
                    const d = new Date(p.createdAt);
                    d.setDate(d.getDate() + plan.durationDays);
                    return d.toISOString();
                })(),
            })),
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
