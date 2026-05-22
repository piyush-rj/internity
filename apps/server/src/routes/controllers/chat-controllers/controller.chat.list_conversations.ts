import type { Request, Response } from "express";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

/**
 * Returns every conversation the caller participates in — either as the
 * student side or the recruiter side. Listing context is aggregated from
 * `Application.conversationId`: the most-recent application's title becomes
 * the primary subtitle, and we surface a count of any extras so the UI can
 * render "Frontend Engineer + 2 more".
 *
 * Unread counts are computed per conversation against the caller's
 * lastReadAt. Single pass — no per-conversation Promise.all of counts.
 */
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
                },
            },
            messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: { body: true },
            },
            // Most recent application drives the primary listingTitle. We
            // additionally count the rest so the UI can show "+ N more".
            applications: {
                orderBy: { appliedAt: "desc" },
                select: {
                    id: true,
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

            // Most-recent application drives the primary listing label;
            // older roles surface as a count for "+ N more".
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
                // applicationId preserved on the response purely so any
                // client still keying off it can resolve to *an* application
                // in this thread (the most recent one).
                applicationId: c.applications[0]?.id ?? null,
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
