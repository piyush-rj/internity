import type { Request, Response } from "express";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// lists every conversation the caller participates in with unread counts
export default async function listConversations(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [{ studentId: userId }, { recruiterId: userId }],
        },
        orderBy: { lastMessageAt: "desc" },
        select: {
            id: true,
            studentId: true,
            recruiterId: true,
            lastMessageAt: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isOnline: true,
                    lastSeenAt: true,
                    deletedAt: true,
                },
            },
            recruiter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isOnline: true,
                    lastSeenAt: true,
                    deletedAt: true,
                },
            },
            messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: { body: true },
            },
            applications: {
                orderBy: { appliedAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            company: { select: { name: true } },
                        },
                    },
                },
            },
            reads: {
                select: { userId: true, lastReadAt: true },
            },
        },
    });

    const items = await Promise.all(
        conversations.map(async (c) => {
            const isStudent = userId === c.studentId;
            const peer = isStudent ? c.recruiter : c.student;
            const viewerLastRead =
                c.reads.find((r) => r.userId === userId)?.lastReadAt ?? null;
            const peerLastRead =
                c.reads.find((r) => r.userId === peer.id)?.lastReadAt ?? null;

            const primary = c.applications[0]?.listing ?? null;
            const otherRolesCount = Math.max(0, c.applications.length - 1);

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
                applicationId: c.applications[0]?.id ?? null,
                applicationStatus: c.applications[0]?.status ?? null,
                listingId: primary?.id ?? null,
                listingTitle: primary?.title ?? null,
                companyName: primary?.company.name ?? null,
                otherRolesCount,
                peer: {
                    id: peer.id,
                    name: peer.name,
                    email: peer.email,
                    image: peer.image,
                    isOnline: peer.isOnline,
                    lastSeenAt: peer.lastSeenAt
                        ? peer.lastSeenAt.toISOString()
                        : null,
                    deletedAt: peer.deletedAt
                        ? peer.deletedAt.toISOString()
                        : null,
                },
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
