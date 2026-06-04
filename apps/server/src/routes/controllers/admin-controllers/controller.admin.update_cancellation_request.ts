import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    action: z.enum(["approve", "reject"]),
    adminNote: z.string().max(1000).optional(),
});

export default async function updateCancellationRequest(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { id } = req.params;
        const body = Body.parse(req.body);

        const existing = await prisma.cancellationRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            api.notFound();
            return;
        }

        if (existing.status !== "PENDING") {
            api.fail(409, "ALREADY_RESOLVED", "This request has already been resolved.");
            return;
        }

        const newStatus = body.action === "approve" ? "APPROVED" : "REJECTED";

        const updated = await prisma.$transaction(async (tx) => {
            const request = await tx.cancellationRequest.update({
                where: { id },
                data: {
                    status: newStatus,
                    adminNote: body.adminNote?.trim() ?? null,
                    resolvedById: req.user!.id,
                    resolvedAt: new Date(),
                },
            });

            // On approval: revoke the user's premium immediately
            if (newStatus === "APPROVED") {
                await tx.user.update({
                    where: { id: existing.userId },
                    data: {
                        isPremium: false,
                        premiumUntil: null,
                        activePlanCode: null,
                    },
                });
            }

            return request;
        });

        api.ok({
            request: {
                id: updated.id,
                status: updated.status,
                resolvedAt: updated.resolvedAt?.toISOString() ?? null,
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
