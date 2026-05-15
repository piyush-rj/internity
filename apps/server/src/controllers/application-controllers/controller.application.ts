import type { Request, Response } from "express";
import z from "zod";
import { prisma, ApplicationStatus, NotificationType } from "database";
import ResponseWriter from "../../class/response_writer";
import { notify, notifyMany } from "../../services/service.notification";

export default class ApplicationController {
    static apply_schema = z.object({
        coverLetter: z.string().optional(),
    });

    static status_schema = z.object({
        status: z.enum([
            ApplicationStatus.APPLIED,
            ApplicationStatus.SHORTLISTED,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.HIRED,
            ApplicationStatus.REJECTED,
        ]),
    });

    private static async listing_company_for(listingId: string) {
        const row = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { companyId: true, closedAt: true },
        });
        return row;
    }

    private static async is_member(companyId: string, userId: string) {
        const row = await prisma.companyMember.findUnique({
            where: { companyId_userId: { companyId, userId } },
            select: { role: true },
        });
        return !!row;
    }

    static async apply(req: Request, res: Response) {
        const listingId = req.params.id;
        if (typeof listingId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = ApplicationController.apply_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const listing =
                await ApplicationController.listing_company_for(listingId);
            if (!listing) {
                ResponseWriter.not_found(res, "Listing not found");
                return;
            }
            if (listing.closedAt) {
                ResponseWriter.invalid_data(res, "Listing is closed");
                return;
            }

            // Block the company's own members from applying to their own listing
            if (
                await ApplicationController.is_member(
                    listing.companyId,
                    req.user!.id,
                )
            ) {
                ResponseWriter.invalid_data(
                    res,
                    "You cannot apply to your own company",
                );
                return;
            }

            const profile = await prisma.studentProfile.findUnique({
                where: { userId: req.user!.id },
                select: { resumeUrl: true },
            });
            if (!profile) {
                ResponseWriter.invalid_data(res, "Create your profile first");
                return;
            }

            const application = await prisma.application.create({
                data: {
                    listingId,
                    studentId: req.user!.id,
                    coverLetter: data.coverLetter,
                    resumeUrl: profile.resumeUrl, // snapshot
                },
                include: {
                    listing: {
                        select: {
                            title: true,
                            company: { select: { name: true } },
                        },
                    },
                    student: { select: { name: true } },
                },
            });

            // Notify every member of the company that owns this listing.
            const members = await prisma.companyMember.findMany({
                where: { companyId: listing.companyId },
                select: { userId: true },
            });
            await notifyMany(
                members.map((m) => m.userId),
                {
                    type: NotificationType.APPLICATION_RECEIVED,
                    title: `${application.student.name} applied to ${application.listing.title}`,
                    body: `New applicant for your ${application.listing.title} listing.`,
                    link: `/home/applicants?listingId=${listingId}`,
                },
            );

            ResponseWriter.success(res, { application }, "Applied", 201);
        } catch (err: unknown) {
            if (
                typeof err === "object" &&
                err !== null &&
                (err as { code?: string }).code === "P2002"
            ) {
                ResponseWriter.invalid_data(
                    res,
                    "You have already applied to this listing",
                );
                return;
            }
            console.error("application.apply:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async list_mine(req: Request, res: Response) {
        try {
            const items = await prisma.application.findMany({
                where: { studentId: req.user!.id },
                orderBy: { appliedAt: "desc" },
                include: {
                    listing: {
                        include: {
                            company: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    logoUrl: true,
                                },
                            },
                        },
                    },
                },
            });
            ResponseWriter.success(res, { items });
        } catch (err) {
            console.error("application.list_mine:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async get(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const application = await prisma.application.findUnique({
                where: { id },
                include: {
                    listing: { include: { company: true } },
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            studentProfile: true,
                        },
                    },
                },
            });
            if (!application) {
                ResponseWriter.not_found(res);
                return;
            }

            const isApplicant = application.studentId === req.user!.id;
            const isCompanyMember =
                !isApplicant &&
                (await ApplicationController.is_member(
                    application.listing.companyId,
                    req.user!.id,
                ));
            if (!isApplicant && !isCompanyMember) {
                ResponseWriter.unauthorized(res, "Not allowed", 403);
                return;
            }

            ResponseWriter.success(res, { application });
        } catch (err) {
            console.error("application.get:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async withdraw(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const result = await prisma.application.updateMany({
                where: { id, studentId: req.user!.id },
                data: {
                    status: ApplicationStatus.WITHDRAWN,
                    statusUpdatedAt: new Date(),
                },
            });
            if (result.count === 0) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("application.withdraw:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async list_for_listing(req: Request, res: Response) {
        const listingId = req.params.id;
        if (typeof listingId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const listing =
                await ApplicationController.listing_company_for(listingId);
            if (!listing) {
                ResponseWriter.not_found(res);
                return;
            }
            if (
                !(await ApplicationController.is_member(
                    listing.companyId,
                    req.user!.id,
                ))
            ) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }

            const items = await prisma.application.findMany({
                where: { listingId },
                orderBy: { appliedAt: "desc" },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            studentProfile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    city: true,
                                    bio: true,
                                },
                            },
                        },
                    },
                },
            });
            ResponseWriter.success(res, { items });
        } catch (err) {
            console.error("application.list_for_listing:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async update_status(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = ApplicationController.status_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const existing = await prisma.application.findUnique({
                where: { id },
                select: { listing: { select: { companyId: true } } },
            });
            if (!existing) {
                ResponseWriter.not_found(res);
                return;
            }
            if (
                !(await ApplicationController.is_member(
                    existing.listing.companyId,
                    req.user!.id,
                ))
            ) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }

            const application = await prisma.application.update({
                where: { id },
                data: { status: data.status, statusUpdatedAt: new Date() },
                include: {
                    listing: {
                        select: {
                            title: true,
                            company: { select: { name: true } },
                        },
                    },
                },
            });

            // Notify the student about the new decision.
            await notify({
                userId: application.studentId,
                type: NotificationType.APPLICATION_STATUS_CHANGED,
                title: `${application.listing.company.name} marked you as ${formatStatus(application.status)}`,
                body: `${application.listing.title} · ${formatStatus(application.status)}`,
                link: `/home/applications`,
            });

            ResponseWriter.success(res, { application });
        } catch (err) {
            console.error("application.update_status:", err);
            ResponseWriter.server_error(res);
        }
    }
}

function formatStatus(s: ApplicationStatus): string {
    switch (s) {
        case "APPLIED":
            return "Applied";
        case "SHORTLISTED":
            return "Shortlisted";
        case "INTERVIEW":
            return "Interview";
        case "HIRED":
            return "Hired";
        case "REJECTED":
            return "Rejected";
        case "WITHDRAWN":
            return "Withdrawn";
    }
}
