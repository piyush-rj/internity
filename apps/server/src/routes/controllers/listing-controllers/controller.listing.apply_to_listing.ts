import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { NotificationType, Prisma, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";
import {
    ScreeningAnswersSchema,
    type ScreeningAnswer,
    type ScreeningQuestion,
    validateAnswers,
} from "../../../utils/screening.ts";

const Body = z.object({
    coverLetter: z
        .string()
        .max(150, "Keep your cover note under 150 characters")
        .optional(),
    // Per-type response: { value: string | number }. Indices line up with
    // the listing's screeningQuestions.
    screeningAnswers: ScreeningAnswersSchema.optional(),
    // Student-picked resume URL. When omitted we fall back to the profile's
    // default resume. Validated below against the student's own Resume rows.
    resumeUrl: z.string().url().nullable().optional(),
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
            screeningQuestions: true,
            postedBy: { select: { isBanned: true } },
        },
    });
    if (!found) throw new NotFound("Listing not found");
    if (found.takenDownAt !== null) throw new NotFound("Listing not found");
    if (found.postedBy.isBanned) throw new NotFound("Listing not found");
    if (found.closedAt !== null) throw new InvalidRequest("Listing is closed");
    if (found.pausedAt !== null) {
        throw new InvalidRequest(
            "This role has paused hiring. Try again later.",
        );
    }
    if (found.expiresAt !== null && found.expiresAt.getTime() <= Date.now()) {
        throw new InvalidRequest("This role's application window has closed.");
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
        select: { id: true, resumeUrl: true },
    });
    if (!profile) throw new InvalidRequest("Create your profile first");

    // If the student passed a resumeUrl, it must be one of their resumes.
    let resumeUrl: string | null = profile.resumeUrl;
    if (body.resumeUrl) {
        const own = await prisma.resume.findFirst({
            where: { studentId: profile.id, url: body.resumeUrl },
            select: { id: true },
        });
        if (!own) throw new InvalidRequest("Pick one of your saved resumes");
        resumeUrl = body.resumeUrl;
        await prisma.resume.update({
            where: { id: own.id },
            data: { lastUsedAt: new Date() },
        });
    }

    const coverLetter = body.coverLetter?.trim() || null;

    // Re-parse the listing's stored questions (jsonb -> typed array) and
    // validate the submitted answers against them. validateAnswers throws
    // a human-readable Error which we wrap as an InvalidRequest.
    const storedQuestions = (found.screeningQuestions ??
        []) as unknown as ScreeningQuestion[];
    let submittedAnswers: ScreeningAnswer[] = [];
    if (storedQuestions.length > 0) {
        try {
            submittedAnswers = validateAnswers(
                storedQuestions,
                body.screeningAnswers ?? [],
            );
        } catch (err) {
            throw new InvalidRequest(
                err instanceof Error
                    ? err.message
                    : "Please answer every screening question before applying.",
            );
        }
    }

    let application;
    try {
        application = await prisma.application.create({
            data: {
                listingId: id,
                studentId: req.user!.id,
                coverLetter,
                resumeUrl,
                screeningAnswers:
                    submittedAnswers as unknown as Prisma.InputJsonValue,
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

    // Persist the cover letter on the profile so the next Apply form can
    // offer a one-click prefill. Best-effort: a failure here shouldn't
    // void a successful application.
    if (coverLetter) {
        try {
            await prisma.studentProfile.update({
                where: { id: profile.id },
                data: { lastCoverLetter: coverLetter },
            });
        } catch (err) {
            console.error("failed to persist lastCoverLetter", err);
        }
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
