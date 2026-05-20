import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    applicationId: z.string().min(1),
});

/**
 * Employer-initiated chat. Idempotent — calling twice returns the same row.
 *
 * Only company members of the application's listing can call this; applicants
 * can reply once the conversation exists, but they cannot create it.
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
            include: { listing: { select: { companyId: true } } },
        });
        if (!application) throw new NotFound("Application not found");

        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: application.listing.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) {
            throw new Forbidden("Only the company's team can start a chat");
        }

        const conversation = await prisma.conversation.upsert({
            where: { applicationId },
            create: { applicationId },
            update: {},
        });

        api.ok({ id: conversation.id });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
