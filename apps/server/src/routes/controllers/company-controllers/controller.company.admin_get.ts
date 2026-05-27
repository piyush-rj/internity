import type { Request, Response } from "express";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// admin-only company detail with members and recent listings snapshot
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
                        jobTitle: true,
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
