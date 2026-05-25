import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    applicationId: z.string().min(1),
});

/**
 * Employer-initiated chat. Idempotent — calling twice for any application
 * sharing the same (student, recruiter) pair returns the same conversation.
 *
 * Authorisation: the caller must be a company member of the listing that
 * received the application. The actual recruiter on the other end is the
 * listing's `postedBy` (which may be a different company member than the
 * caller, e.g. a manager helping out the team).
 *
 * On the first call we also stamp `Application.conversationId` so future
 * lookups can fan applications into their thread without re-joining the
 * Application/Listing chain.
 */
export default async function startConversation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { applicationId } = Body.parse(req.body);

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: {
                id: true,
                studentId: true,
                conversationId: true,
                listing: {
                    select: { companyId: true, postedById: true },
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
            throw new Forbidden("Only the company's team can start a chat");
        }

        const studentId = application.studentId;
        const recruiterId = application.listing.postedById;

        // Find-or-create by pair. `upsert` against the composite unique index
        // is a single round-trip and survives concurrent first-message-from-
        // each-side races (whichever wins the insert, the other sees the
        // existing row).
        const conversation = await prisma.conversation.upsert({
            where: { studentId_recruiterId: { studentId, recruiterId } },
            create: { studentId, recruiterId },
            update: {},
            select: { id: true },
        });

        // Backfill the link on the application if it hasn't been wired yet —
        // typically true on first start, no-op otherwise.
        if (application.conversationId !== conversation.id) {
            await prisma.application.update({
                where: { id: application.id },
                data: { conversationId: conversation.id },
            });
        }

        api.ok({ id: conversation.id });
    } catch (err) {
        handleApiError(err, api);
    }
}
