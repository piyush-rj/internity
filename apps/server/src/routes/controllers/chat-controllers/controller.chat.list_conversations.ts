import type { Request, Response } from "express";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listConversations(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
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
            reads: {
                select: { userId: true, lastReadAt: true },
            },
            messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: { body: true },
            },
        },
    });

    const items = await Promise.all(
        conversations.map(async (c) => {
            const student = c.application.student;
            const isStudent = userId === student.id;

            // Peer for the viewer: student view → listing poster; otherwise → student.
            let peer: {
                id: string;
                name: string | null;
                email: string | null;
                image: string | null;
            };
            if (isStudent) {
                const poster = await prisma.user.findUnique({
                    where: { id: c.application.listing.postedById },
                    select: { id: true, name: true, email: true, image: true },
                });
                peer = poster ?? {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    image: student.image,
                };
            } else {
                peer = {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    image: student.image,
                };
            }

            const viewerLastRead =
                c.reads.find((r) => r.userId === userId)?.lastReadAt ?? null;
            const peerLastRead =
                c.reads.find((r) => r.userId === peer.id)?.lastReadAt ?? null;

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: c.id,
                    senderId: { not: userId },
                    ...(viewerLastRead
                        ? { createdAt: { gt: viewerLastRead } }
                        : {}),
                },
            });

            return {
                id: c.id,
                applicationId: c.applicationId,
                listingId: c.application.listingId,
                listingTitle: c.application.listing.title,
                companyName: c.application.listing.company.name,
                peer,
                lastMessageAt: c.lastMessageAt.toISOString(),
                lastMessagePreview: c.messages[0]
                    ? c.messages[0].body.slice(0, 80)
                    : null,
                unreadCount,
                peerLastReadAt: peerLastRead
                    ? peerLastRead.toISOString()
                    : null,
            };
        }),
    );

    api.ok(items);
}
