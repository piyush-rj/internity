import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
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

        // Verify the payment belongs to this user and was successful
        const payment = await prisma.payment.findUnique({
            where: { id: body.paymentId },
            include: { cancellationRequest: true },
        });

        if (!payment || payment.userId !== userId) {
            api.notFound();
            return;
        }

        if (payment.status !== "SUCCESS") {
            api.fail(400, "INVALID_PAYMENT", "Only successful payments can be cancelled.");
            return;
        }

        if (payment.cancellationRequest) {
            api.fail(409, "ALREADY_REQUESTED", "A cancellation request already exists for this payment.");
            return;
        }

        // Block if the employer has used any listings from this plan
        const now = new Date();
        const listingsUsed = await prisma.listing.count({
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
