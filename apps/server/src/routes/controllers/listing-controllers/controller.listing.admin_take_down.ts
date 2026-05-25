import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

const Body = z.object({
    reason: z
        .string()
        .min(1, "Add a short reason so the founder knows what to fix")
        .max(500, "Keep the reason under 500 characters"),
});

/**
 * Admin-only soft-removal. Sets takenDownAt/takedownReason/takenDownById
 * on the listing and notifies every member of the owning company. The
 * record is preserved so a future restore is just a column reset.
 */
export default async function adminTakeDownListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing listing id");
        const body = Body.parse(req.body);

        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        members: { select: { userId: true } },
                    },
                },
            },
        });
        if (!listing) throw new NotFound("Listing not found");

        const reason = body.reason.trim();
        const updated = await prisma.listing.update({
            where: { id },
            data: {
                takenDownAt: new Date(),
                takedownReason: reason,
                takenDownById: req.user!.id,
            },
        });

        const memberIds = listing.company.members.map((m) => m.userId);
        await notifyMany(memberIds, {
            type: NotificationType.LISTING_TAKEN_DOWN,
            title: `Listing removed: ${listing.title}`,
            body: reason,
            link: "/home/manage-listings",
        });

        api.ok({ listing: updated }, "Listing taken down");
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid request");
            return;
        }
        console.error(err);
        api.internalError();
    }
}
