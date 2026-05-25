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
                postedBy: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        isBanned: true,
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
        if (l.takenDownAt) throw new NotFound();
        if (l.pausedAt) throw new NotFound();
        if (l.expiresAt && l.expiresAt.getTime() <= Date.now()) {
            throw new NotFound();
        }
        if (l.postedBy.isBanned) throw new NotFound();
        api.ok({ listing: l });
    } catch (err) {
        handleApiError(err, api);
    }
}
