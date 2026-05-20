"use client";

import { useEffect } from "react";
import { chatApi } from "@/src/lib/api";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useMeStore } from "@/src/store/useMeStore";
import { useChatStore } from "@/src/store/useChatStore";
import { MESSAGE_TYPE } from "types";

/**
 * Seeds the chat-unread store on mount and keeps it live via WS events.
 * Rendered once inside the home layout so the sidebar badge stays accurate
 * regardless of which route the user is currently viewing.
 */
export function UnreadChatsBootstrap() {
    const socket = useWebSocket();
    const meId = useMeStore((s) => s.me?.id ?? null);
    const setUnread = useChatStore((s) => s.setUnread);
    const bumpUnread = useChatStore((s) => s.bumpUnread);
    const clearUnread = useChatStore((s) => s.clearUnread);

    // Initial seed from the conversation list — the server already computes
    // unread counts there, no need for a second roundtrip.
    useEffect(() => {
        if (!meId) return;
        let cancelled = false;
        chatApi
            .list_conversations()
            .then((rows) => {
                if (cancelled) return;
                const map: Record<string, number> = {};
                for (const c of rows) {
                    if (c.unreadCount > 0) map[c.id] = c.unreadCount;
                }
                setUnread(map);
            })
            .catch(() => {
                /* silent — sidebar badge is best-effort */
            });
        return () => {
            cancelled = true;
        };
    }, [meId, setUnread]);

    // Live updates: bump on inbound messages from others, clear when we
    // mark a conversation read ourselves.
    useEffect(() => {
        if (!meId) return;
        return socket.addListener((msg) => {
            if (msg.type === MESSAGE_TYPE.MESSAGE_CREATED) {
                if (msg.message.senderId === meId) return;
                bumpUnread(msg.message.conversationId);
            } else if (msg.type === MESSAGE_TYPE.CONVERSATION_READ) {
                if (msg.readerId !== meId) return;
                clearUnread(msg.conversationId);
            }
        });
    }, [socket, meId, bumpUnread, clearUnread]);

    return null;
}
