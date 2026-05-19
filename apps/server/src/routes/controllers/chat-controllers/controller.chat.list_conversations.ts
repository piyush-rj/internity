import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listConversations(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;

        const conversations = await prisma.conversation.findMany({
            where: {
                application: {
                    OR: [
                        { studentId: userId },
                        {
                            listing: {
                                company: { members: { some: { userId } } },
                            },
                        },
                    ],
                },
            },
            orderBy: { lastMessageAt: "desc" },
            include: {
                application: {
                    include: {
                        student: true,
                        listing: { include: { company: true } },
                    },
                },
            },
        });

        const items = await Promise.all(
            conversations.map(async (c) => {
                const last = await prisma.message.findFirst({
                    where: { conversationId: c.id },
                    orderBy: { createdAt: "desc" },
                });
                // Peer: from student view → listing poster; otherwise → student.
                const student = c.application.student;
                let peer: {
                    id: string;
                    name: string | null;
                    image: string | null;
                };
                if (userId === student.id) {
                    const poster = await prisma.user.findUnique({
                        where: { id: c.application.listing.postedById },
                        select: { id: true, name: true, image: true },
                    });
                    peer = poster ?? {
                        id: student.id,
                        name: student.name,
                        image: student.image,
                    };
                } else {
                    peer = {
                        id: student.id,
                        name: student.name,
                        image: student.image,
                    };
                }
                return {
                    id: c.id,
                    applicationId: c.applicationId,
                    listingId: c.application.listingId,
                    listingTitle: c.application.listing.title,
                    companyName: c.application.listing.company.name,
                    peer,
                    lastMessageAt: c.lastMessageAt.toISOString(),
                    lastMessagePreview: last ? last.body.slice(0, 80) : null,
                    unread: false, // placeholder — read receipts are a follow-up
                };
            }),
        );
        api.ok(items);
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
