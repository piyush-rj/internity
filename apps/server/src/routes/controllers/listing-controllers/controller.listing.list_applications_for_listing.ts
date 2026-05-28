import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { canManageApplicants } from "../../../utils/company-roles.ts";

export default async function listApplicationsForListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: {
                companyId: true,
                screeningQuestions: true,
                skillTagsRaw: true,
            },
        });
        if (!found) throw new NotFound();
        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: found.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");
        if (!canManageApplicants(member.role)) {
            throw new Forbidden(
                "Your role can't view applicants for this listing.",
            );
        }

        // stamp unseen applicants as seen before returning rows
        await prisma.application.updateMany({
            where: { listingId: id, seenAt: null },
            data: { seenAt: new Date() },
        });

        const rows = await prisma.application.findMany({
            where: { listingId: id },
            orderBy: { appliedAt: "desc" },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        deletedAt: true,
                        studentProfile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                                city: true,
                                bio: true,
                                isVerified: true,
                                skills: {
                                    select: {
                                        skill: { select: { name: true } },
                                    },
                                },
                                educations: {
                                    select: {
                                        institute: true,
                                        degree: true,
                                        fieldOfStudy: true,
                                        startYear: true,
                                        endYear: true,
                                        current: true,
                                    },
                                    orderBy: [
                                        { current: "desc" },
                                        { startYear: "desc" },
                                    ],
                                    take: 2,
                                },
                                projects: {
                                    select: {
                                        id: true,
                                        title: true,
                                        link: true,
                                    },
                                    take: 4,
                                    orderBy: { endDate: "desc" },
                                },
                                experiences: {
                                    select: {
                                        id: true,
                                        title: true,
                                        company: true,
                                        startDate: true,
                                        endDate: true,
                                        current: true,
                                    },
                                    take: 4,
                                    orderBy: [
                                        { current: "desc" },
                                        { startDate: "desc" },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        });
        api.ok({
            items: rows,
            screeningQuestions: found.screeningQuestions,
            skillTagsRaw: found.skillTagsRaw,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
