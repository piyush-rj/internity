import type { Request, Response } from "express";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

/**
 * Admin-only restore. Clears the takedown columns and notifies the company
 * members so the founder knows their listing is back online.
 */
export default async function adminRestoreListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing listing id");

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
        if (!listing.takenDownAt) {
            // Idempotent: already live, just respond OK.
            api.ok({ listing }, "Listing is already live");
            return;
        }

        const updated = await prisma.listing.update({
            where: { id },
            data: {
                takenDownAt: null,
                takedownReason: null,
                takenDownById: null,
            },
        });

        const memberIds = listing.company.members.map((m) => m.userId);
        await notifyMany(memberIds, {
            type: NotificationType.LISTING_RESTORED,
            title: `Listing restored: ${listing.title}`,
            body: "Your listing is live again on SpiderSkill.",
            link: `/home/listings/${listing.id}`,
        });

        api.ok({ listing: updated }, "Listing restored");
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}
