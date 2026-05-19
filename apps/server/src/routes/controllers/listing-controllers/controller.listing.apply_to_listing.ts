import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { NotificationType, Prisma, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

const Body = z.object({
    coverLetter: z.string().min(1).max(1200),
});

export default async function applyToListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const id = req.params.id as string;
    const body = Body.parse(req.body);

    const found = await prisma.listing.findUnique({
        where: { id },
        select: { companyId: true, closedAt: true, title: true },
    });
    if (!found) throw new NotFound("Listing not found");
    if (found.closedAt !== null) throw new InvalidRequest("Listing is closed");

    const member = await prisma.companyMember.findUnique({
        where: {
            companyId_userId: {
                companyId: found.companyId,
                userId: req.user!.id,
            },
        },
    });
    if (member) {
        throw new InvalidRequest("You cannot apply to your own company");
    }

    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.id },
        select: { resumeUrl: true },
    });
    if (!profile) throw new InvalidRequest("Create your profile first");

    let application;
    try {
        application = await prisma.application.create({
            data: {
                listingId: id,
                studentId: req.user!.id,
                coverLetter: body.coverLetter,
                resumeUrl: profile.resumeUrl,
            },
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
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            throw new InvalidRequest(
                "You have already applied to this listing",
            );
        }
        throw err;
    }

    // Open chat channel immediately. Idempotent.
    await prisma.conversation.upsert({
        where: { applicationId: application.id },
        create: { applicationId: application.id },
        update: {},
    });

    const members = await prisma.companyMember.findMany({
        where: { companyId: found.companyId },
        select: { userId: true },
    });
    await notifyMany(
        members.map((m) => m.userId),
        {
            type: NotificationType.APPLICATION_RECEIVED,
            title: `${application.student.name} applied to ${application.listing.title}`,
            body: `New applicant for your ${application.listing.title} listing.`,
            link: `/home/applicants?listingId=${id}`,
        },
    );

    api.created({ application }, "Applied");
}
