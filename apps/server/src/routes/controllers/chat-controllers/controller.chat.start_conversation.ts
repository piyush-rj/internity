import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    applicationId: z.string().min(1),
});

// idempotently starts or returns an existing conversation for an application
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

        const conversation = await prisma.conversation.upsert({
            where: { studentId_recruiterId: { studentId, recruiterId } },
            create: { studentId, recruiterId },
            update: {},
            select: { id: true },
        });

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
