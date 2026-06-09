import type { Request, Response } from "express";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const SPIDERSKILL_VIRTUAL_PEER = {
    id: "SPIDERSKILL_ADMIN",
    name: "SpiderSkill Team",
    email: null,
    image: null,
    isOnline: false,
    lastSeenAt: null,
    deletedAt: null,
};

// lists every conversation the caller participates in with unread counts
export default async function listConversations(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const conversations = await prisma.conversation.findMany({
        where: isAdmin
            ? // Admins see all admin threads plus any regular threads they're in
              { OR: [{ isAdminThread: true }, { studentId: userId }, { recruiterId: userId }] }
            : // Non-admins see their own threads (incl. their admin thread)
              { OR: [{ studentId: userId }, { recruiterId: userId }] },
        orderBy: { lastMessageAt: "desc" },
        select: {
            id: true,
            isAdminThread: true,
            studentId: true,
            recruiterId: true,
            lastMessageAt: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
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
                    role: true,
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
            const viewerLastRead =
                c.reads.find((r) => r.userId === userId)?.lastReadAt ?? null;

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: c.id,
                    senderId: { not: userId },
                    ...(viewerLastRead
                        ? { createdAt: { gt: viewerLastRead } }
                        : {}),
                },
            });

            if (c.isAdminThread) {
                // For admins: peer is the user who opened the thread (student === recruiter)
                // For non-admins: peer is the virtual SpiderSkill Team identity
                const peer = isAdmin
                    ? (() => {
                          const u = c.student;
                          return {
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              image: u.image,
                              isOnline: u.isOnline,
                              lastSeenAt: u.lastSeenAt
                                  ? u.lastSeenAt.toISOString()
                                  : null,
                              deletedAt: u.deletedAt
                                  ? u.deletedAt.toISOString()
                                  : null,
                          };
                      })()
                    : SPIDERSKILL_VIRTUAL_PEER;

                const peerUserId = isAdmin ? c.studentId : null;
                const peerLastRead = peerUserId
                    ? (c.reads.find((r) => r.userId === peerUserId)?.lastReadAt ?? null)
                    : null;

                return {
                    id: c.id,
                    isAdminThread: true,
                    applicationId: null,
                    applicationStatus: null,
                    listingId: null,
                    listingTitle: null,
                    companyName: null,
                    otherRolesCount: 0,
                    peer,
                    peerRole: isAdmin ? (c.student.role as string) : null,
                    lastMessageAt: c.lastMessageAt.toISOString(),
                    lastMessagePreview: c.messages[0]
                        ? c.messages[0].body.slice(0, 80)
                        : null,
                    unreadCount,
                    peerLastReadAt: peerLastRead
                        ? peerLastRead.toISOString()
                        : null,
                };
            }

            // Regular (student <-> employer) thread — unchanged logic
            const isStudent = userId === c.studentId;
            const peer = isStudent ? c.recruiter : c.student;
            const peerLastRead =
                c.reads.find((r) => r.userId === peer.id)?.lastReadAt ?? null;

            const primary = c.applications[0]?.listing ?? null;
            const otherRolesCount = Math.max(0, c.applications.length - 1);

            return {
                id: c.id,
                isAdminThread: false,
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
                peerRole: null,
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
