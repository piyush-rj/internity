import type { Request, Response } from "express";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * Admin-only company detail. Returns the company plus every team member
 * (with employerProfile attached so the overlay can show real names + job
 * titles) and a snapshot of the company's listings (live + recently closed).
 * Used by the admin verification queue overlay AND by the founders/listings
 * sections that come later in Slice 3.
 */
export default async function adminGetCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing company id");

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                members: {
                    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                createdAt: true,
                                isBanned: true,
                                banReason: true,
                                bannedAt: true,
                                employerProfile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        phone: true,
                                        jobTitle: true,
                                        linkedinUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
                listings: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        mode: true,
                        city: true,
                        applyBy: true,
                        closedAt: true,
                        createdAt: true,
                        _count: { select: { applications: true } },
                    },
                },
                _count: {
                    select: {
                        listings: true,
                    },
                },
            },
        });
        if (!company) throw new NotFound("Company not found");

        api.ok({ company });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}
