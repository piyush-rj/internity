"use client";

import { useEffect } from "react";
import { chatApi } from "@/src/lib/api";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useMeStore } from "@/src/store/useMeStore";
import { useChatStore } from "@/src/store/useChatStore";
import { usePresenceStore } from "@/src/store/usePresenceStore";
import { MESSAGE_TYPE } from "types";

/**
 * Seeds the chat-unread + peer-presence stores on mount and keeps both
 * live via WS events. Rendered once inside the home layout so the sidebar
 * badge and chat header presence stay accurate regardless of which route
 * the user is currently viewing.
 */
export function UnreadChatsBootstrap() {
    const socket = useWebSocket();
    const meId = useMeStore((s) => s.me?.id ?? null);
    const setUnread = useChatStore((s) => s.setUnread);
    const bumpUnread = useChatStore((s) => s.bumpUnread);
    const clearUnread = useChatStore((s) => s.clearUnread);
    const seedPresence = usePresenceStore((s) => s.seedPresence);
    const setPresence = usePresenceStore((s) => s.setPresence);

    // Initial seed from the conversation list — the server already computes
    // unread counts + peer presence there, no need for a second roundtrip.
    useEffect(() => {
        if (!meId) return;
        let cancelled = false;
        chatApi
            .list_conversations()
            .then((rows) => {
                if (cancelled) return;
                const unread: Record<string, number> = {};
                const presence: Array<{
                    userId: string;
                    isOnline: boolean;
                    lastSeenAt: string | null;
                }> = [];
                for (const c of rows) {
                    if (c.unreadCount > 0) unread[c.id] = c.unreadCount;
                    presence.push({
                        userId: c.peer.id,
                        isOnline: c.peer.isOnline,
                        lastSeenAt: c.peer.lastSeenAt,
                    });
                }
                setUnread(unread);
                seedPresence(presence);
            })
            .catch(() => {
                /* silent — sidebar badge is best-effort */
            });
        return () => {
            cancelled = true;
        };
    }, [meId, setUnread, seedPresence]);

    // Live updates: bump unread on inbound messages from others, clear on
    // our own read marker, refresh presence when peers come and go.
    useEffect(() => {
        if (!meId) return;
        return socket.addListener((msg) => {
            if (msg.type === MESSAGE_TYPE.MESSAGE_CREATED) {
                if (msg.message.senderId === meId) return;
                bumpUnread(msg.message.conversationId);
            } else if (msg.type === MESSAGE_TYPE.CONVERSATION_READ) {
                if (msg.readerId !== meId) return;
                clearUnread(msg.conversationId);
            } else if (msg.type === MESSAGE_TYPE.USER_PRESENCE) {
                setPresence(msg.userId, {
                    isOnline: msg.isOnline,
                    lastSeenAt: msg.lastSeenAt,
                });
            }
        });
    }, [socket, meId, bumpUnread, clearUnread, setPresence]);

    return null;
}
