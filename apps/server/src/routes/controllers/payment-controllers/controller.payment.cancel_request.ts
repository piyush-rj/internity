import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    paymentId: z.string().min(1),
    reason: z.enum([
        "TOO_EXPENSIVE",
        "LOW_APPLICANT_QUALITY",
        "ALREADY_HIRED",
        "FOUND_BETTER_PLATFORM",
        "TECHNICAL_ISSUES",
        "OTHER",
    ]),
    otherText: z.string().max(1000).optional(),
});

export default async function cancelRequest(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;
        const body = Body.parse(req.body);

        if (body.reason === "OTHER" && !body.otherText?.trim()) {
            api.fail(400, "VALIDATION_ERROR", "Please describe your reason.");
            return;
        }

        // Resolve the payment and the company it belongs to.
        const payment = await prisma.payment.findUnique({
            where: { id: body.paymentId },
            include: { cancellationRequest: true },
        });

        if (!payment) {
            api.notFound();
            return;
        }

        if (payment.status !== "SUCCESS") {
            api.fail(
                400,
                "INVALID_PAYMENT",
                "Only successful payments can be cancelled.",
            );
            return;
        }

        if (payment.cancellationRequest) {
            api.fail(
                409,
                "ALREADY_REQUESTED",
                "A cancellation request already exists for this payment.",
            );
            return;
        }

        const companyId = payment.companyId ?? null;

        if (companyId) {
            // Company-scoped payment: only the FOUNDER_OWNER may request
            // cancellation — other members can buy but not cancel.
            const membership = await prisma.companyMember.findFirst({
                where: { userId, companyId },
                select: { role: true },
            });

            if (!membership) {
                throw new Forbidden("You are not a member of this company.");
            }

            if (membership.role !== "FOUNDER_OWNER") {
                throw new Forbidden(
                    "Only the company founder can request a cancellation.",
                );
            }
        } else {
            // Legacy user-scoped payment: just verify ownership.
            if (payment.userId !== userId) {
                api.notFound();
                return;
            }
        }

        // Block if the company (or user for legacy) still has active listings —
        // usage means a refund is not eligible.
        const now = new Date();
        const listingsUsed = companyId
            ? await prisma.listing.count({
                  where: {
                      companyId,
                      closedAt: null,
                      takenDownAt: null,
                      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                  },
              })
            : await prisma.listing.count({
                  where: {
                      postedById: userId,
                      closedAt: null,
                      takenDownAt: null,
                      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                  },
              });

        if (listingsUsed > 0) {
            api.fail(
                403,
                "QUOTA_USED",
                `You've posted ${listingsUsed} active listing${listingsUsed === 1 ? "" : "s"} using this subscription. Refunds aren't available after usage.`,
            );
            return;
        }

        const request = await prisma.cancellationRequest.create({
            data: {
                userId,
                companyId,
                paymentId: body.paymentId,
                reason: body.reason,
                otherText: body.otherText?.trim() ?? null,
                listingsUsedAtRequest: listingsUsed,
            },
        });

        api.ok({ request: { id: request.id, status: request.status } });
    } catch (err) {
        handleApiError(err, api);
    }
}
