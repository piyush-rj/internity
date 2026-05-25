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
    // Cover letter is optional and capped at 150 chars per the spec —
    // 1-click apply is the default; a short note is a nice-to-have.
    coverLetter: z
        .string()
        .max(150, "Keep your cover note under 150 characters")
        .optional(),
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
        select: {
            companyId: true,
            closedAt: true,
            takenDownAt: true,
            pausedAt: true,
            expiresAt: true,
            title: true,
        },
    });
    if (!found) throw new NotFound("Listing not found");
    if (found.takenDownAt !== null) throw new NotFound("Listing not found");
    if (found.closedAt !== null) throw new InvalidRequest("Listing is closed");
    if (found.pausedAt !== null) {
        throw new InvalidRequest(
            "This role has paused hiring. Try again later.",
        );
    }
    if (
        found.expiresAt !== null &&
        found.expiresAt.getTime() <= Date.now()
    ) {
        throw new InvalidRequest(
            "This role's application window has closed.",
        );
    }

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

    const coverLetter = body.coverLetter?.trim() || null;

    let application;
    try {
        application = await prisma.application.create({
            data: {
                listingId: id,
                studentId: req.user!.id,
                coverLetter,
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
