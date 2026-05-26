import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    applicationId: z.string().min(1, "Application is required"),
    title: z
        .string()
        .trim()
        .min(3, "Add a short title")
        .max(120, "Keep the title under 120 characters"),
    type: z.enum(["VIDEO", "PHONE"]),
    scheduledAt: z.string().datetime({ message: "Pick a valid date and time" }),
    endsAt: z.string().datetime({ message: "Pick a valid end time" }),
    // VIDEO interviews require a pasted meeting link (Meet/Zoom/Teams).
    meetingLink: z
        .string()
        .trim()
        .url("Meeting link must be a valid URL")
        .max(500)
        .optional(),
    hostPhone: z.string().trim().max(30).optional(),
    description: z
        .string()
        .trim()
        .max(1500, "Keep the description under 1500 characters")
        .optional(),
});

// schedules an interview, cancelling any existing scheduled one as reschedule
export default async function scheduleInterview(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        const scheduledAt = new Date(body.scheduledAt);
        const endsAt = new Date(body.endsAt);
        if (endsAt.getTime() <= scheduledAt.getTime()) {
            throw new InvalidRequest("End time must be after start time");
        }
        if (scheduledAt.getTime() < Date.now() - 60_000) {
            throw new InvalidRequest("Interview can't be in the past");
        }

        if (body.type === "VIDEO" && !body.meetingLink) {
            throw new InvalidRequest(
                "Paste a meeting link (Meet / Zoom / Teams) for video interviews",
            );
        }
        if (body.type === "PHONE" && !body.hostPhone) {
            throw new InvalidRequest(
                "Share your phone number so the candidate can reach you",
            );
        }

        const application = await prisma.application.findUnique({
            where: { id: body.applicationId },
            select: {
                id: true,
                studentId: true,
                listing: {
                    select: {
                        id: true,
                        title: true,
                        companyId: true,
                        company: { select: { name: true } },
                    },
                },
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        studentProfile: { select: { phone: true } },
                    },
                },
            },
        });
        if (!application) throw new NotFound("Application not found");

        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: application.listing.companyId,
                    userId: req.user!.id,
                },
            },
            select: { userId: true },
        });
        if (!member) {
            throw new Forbidden(
                "Only the company's team can schedule interviews",
            );
        }

        await prisma.interview.updateMany({
            where: {
                applicationId: application.id,
                status: "SCHEDULED",
            },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason: "Rescheduled",
            },
        });

        const interview = await prisma.interview.create({
            data: {
                applicationId: application.id,
                hostId: req.user!.id,
                candidateId: application.studentId,
                title: body.title,
                type: body.type,
                scheduledAt,
                endsAt,
                meetingLink: body.meetingLink ?? null,
                hostPhone: body.hostPhone ?? null,
                candidatePhone:
                    application.student.studentProfile?.phone ?? null,
                description: body.description ?? null,
            },
        });

        await prisma.application.update({
            where: { id: application.id },
            data: { status: "INTERVIEW", statusUpdatedAt: new Date() },
        });

        await notify({
            userId: application.studentId,
            type: NotificationType.INTERVIEW_SCHEDULED,
            title: `Interview scheduled with ${application.listing.company.name}`,
            body: `${body.title} on ${scheduledAt.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            })}`,
            link: `/home/schedules`,
        });

        api.created({ interview }, "Interview scheduled");
    } catch (err) {
        handleApiError(err, api);
    }
}
