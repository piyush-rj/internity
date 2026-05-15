import { prisma, NotificationType } from "database";

type NotifyInput = {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string | null;
    link?: string | null;
};

/**
 * Best-effort: writes the notification and never throws. The caller is
 * usually mid-mutation and we don't want a notification failure to roll
 * back the real work.
 */
export async function notify(input: NotifyInput): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: input.title,
                body: input.body ?? null,
                link: input.link ?? null,
            },
        });
    } catch (err) {
        console.error("notify:", err);
    }
}

export async function notifyMany(
    userIds: string[],
    base: Omit<NotifyInput, "userId">,
): Promise<void> {
    if (userIds.length === 0) return;
    try {
        await prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type: base.type,
                title: base.title,
                body: base.body ?? null,
                link: base.link ?? null,
            })),
        });
    } catch (err) {
        console.error("notifyMany:", err);
    }
}
