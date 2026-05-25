import type { Request, Response } from "express";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const l = await prisma.listing.findUnique({
            where: { id: req.params.id as string },
            include: {
                company: true,
                skills: { include: { skill: true } },
                // Surface the poster's name + LinkedIn so the public detail
                // page can render a "Posted by" trust signal next to the
                // company. Email/phone deliberately excluded for privacy.
                postedBy: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        employerProfile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                jobTitle: true,
                                linkedinUrl: true,
                            },
                        },
                    },
                },
            },
        });
        if (!l) throw new NotFound();
        // Hidden from public surfaces: admin takedowns, founder pauses, and
        // listings past their 30-day expiry. The founder learns about each
        // case from the manage-listings UI + the in-app notifications.
        if (l.takenDownAt) throw new NotFound();
        if (l.pausedAt) throw new NotFound();
        if (l.expiresAt && l.expiresAt.getTime() <= Date.now()) {
            throw new NotFound();
        }
        api.ok({ listing: l });
    } catch (err) {
        handleApiError(err, api);
    }
}
