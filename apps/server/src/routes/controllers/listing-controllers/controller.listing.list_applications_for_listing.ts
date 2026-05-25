import type { Request, Response } from "express";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

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

        // The founder is opening their applicants list — stamp every unseen
        // applicant on this listing as seen. Orthogonal to status; runs
        // before the read below so the returned rows carry the fresh
        // seenAt value.
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
                        studentProfile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                                city: true,
                                bio: true,
                                skills: {
                                    select: {
                                        skill: { select: { name: true } },
                                    },
                                },
                                // Top two educations (current first) — drives
                                // the "College (A→Z)" sort and the structured
                                // Education row on the applicant card.
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
