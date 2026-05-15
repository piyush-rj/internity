"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationApi, type AppNotification } from "@/src/lib/api";

const POLL_MS = 30_000;

export type NotificationsState = {
    items: AppNotification[];
    unread: number;
    loading: boolean;
    refetch: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
};

export function useNotifications(): NotificationsState {
    const [items, setItems] = useState<AppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        try {
            const res = await notificationApi.list(20);
            setItems(res.items);
            setUnread(res.unread);
        } catch {
            // swallow — keep showing whatever we had
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refetch();
        const handle = setInterval(() => {
            if (!cancelled && document.visibilityState === "visible") {
                refetch();
            }
        }, POLL_MS);
        function onVisible() {
            if (document.visibilityState === "visible") refetch();
        }
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            cancelled = true;
            clearInterval(handle);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refetch]);

    const markRead = useCallback(
        async (id: string) => {
            setItems((prev) =>
                prev.map((n) =>
                    n.id === id && !n.readAt
                        ? { ...n, readAt: new Date().toISOString() }
                        : n,
                ),
            );
            setUnread((u) => {
                const target = items.find((n) => n.id === id);
                return target && !target.readAt ? Math.max(0, u - 1) : u;
            });
            try {
                await notificationApi.mark_read(id);
            } catch {
                refetch();
            }
        },
        [items, refetch],
    );

    const markAllRead = useCallback(async () => {
        const now = new Date().toISOString();
        setItems((prev) =>
            prev.map((n) => (n.readAt ? n : { ...n, readAt: now })),
        );
        setUnread(0);
        try {
            await notificationApi.mark_all_read();
        } catch {
            refetch();
        }
    }, [refetch]);

    return { items, unread, loading, refetch, markRead, markAllRead };
}
