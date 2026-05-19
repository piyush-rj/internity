/**
 * Best-effort notification writes.
 *
 * Callers are usually in the middle of a successful mutation and we don't
 * want a notification failure to roll back the real work, so both helpers
 * swallow exceptions after logging them.
 */

import { type NotificationType, prisma } from "../db.ts";

export type NotifyArgs = {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string | null;
    link?: string | null;
};

export async function notify(args: NotifyArgs): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId: args.userId,
                type: args.type,
                title: args.title,
                body: args.body ?? null,
                link: args.link ?? null,
            },
        });
    } catch (err) {
        console.error("notify failed:", err);
    }
}

export async function notifyMany(
    userIds: readonly string[],
    args: Omit<NotifyArgs, "userId">,
): Promise<void> {
    if (userIds.length === 0) return;
    try {
        await prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type: args.type,
                title: args.title,
                body: args.body ?? null,
                link: args.link ?? null,
            })),
        });
    } catch (err) {
        console.error("notifyMany failed:", err);
    }
}
