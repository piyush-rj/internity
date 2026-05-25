import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    reason: z
        .string()
        .trim()
        .max(500, "Keep the reason under 500 characters")
        .optional(),
});

// cancels a scheduled interview and notifies the other party
export default async function cancelInterview(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const body = Body.parse(req.body ?? {});
        const userId = req.user!.id;

        const interview = await prisma.interview.findUnique({
            where: { id },
            select: {
                id: true,
                hostId: true,
                candidateId: true,
                status: true,
                title: true,
                scheduledAt: true,
                application: {
                    select: {
                        listing: {
                            select: {
                                company: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!interview) throw new NotFound("Interview not found");

        if (interview.hostId !== userId && interview.candidateId !== userId) {
            throw new Forbidden("You can't cancel this interview");
        }
        if (interview.status !== "SCHEDULED") {
            throw new InvalidRequest("This interview isn't active");
        }

        const updated = await prisma.interview.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason: body.reason ?? null,
            },
        });

        const recipientId =
            userId === interview.hostId
                ? interview.candidateId
                : interview.hostId;
        const cancelledBy =
            userId === interview.hostId ? "the founder" : "the candidate";

        await notify({
            userId: recipientId,
            type: NotificationType.INTERVIEW_CANCELLED,
            title: `Interview cancelled by ${cancelledBy}`,
            body: `${interview.title} (${interview.scheduledAt.toLocaleString(
                "en-IN",
                { dateStyle: "medium", timeStyle: "short" },
            )}) with ${interview.application.listing.company.name}${
                body.reason ? ` — "${body.reason}"` : ""
            }`,
            link: `/home/schedules`,
        });

        api.ok({ interview: updated }, "Interview cancelled");
    } catch (err) {
        handleApiError(err, api);
    }
}
