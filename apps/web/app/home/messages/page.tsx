"use client";

import { useCallback, useEffect, useState } from "react";
import { ConversationList } from "@/src/components/chat/ConversationList";
import { ConversationView } from "@/src/components/chat/ConversationView";
import { chatApi, type ConversationListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useChatSocket } from "@/src/hooks/useChatSocket";

export default function MessagesPage() {
    const socket = useChatSocket();

    const [conversations, setConversations] = useState<ConversationListItem[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const refresh = useCallback(() => {
        chatApi
            .list_conversations()
            .then((rows) => {
                setError(null);
                setConversations(rows);
                setActiveId((curr) => curr ?? rows[0]?.id ?? null);
            })
            .catch((err) => {
                setError(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn’t load conversations.",
                );
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Bump conversation list ordering when a new message lands.
    useEffect(() => {
        const off = socket.addListener((msg) => {
            if (msg.type !== "message_created") return;
            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) => c.id === msg.message.conversationId,
                );
                if (idx === -1) {
                    // New conversation surfaced — refetch to fill in metadata.
                    refresh();
                    return prev;
                }
                const updated = {
                    ...prev[idx]!,
                    lastMessageAt: msg.message.createdAt,
                    lastMessagePreview: msg.message.body.slice(0, 80),
                };
                const next = [...prev];
                next.splice(idx, 1);
                next.unshift(updated);
                return next;
            });
        });
        return off;
    }, [socket, refresh]);

    return (
        <div className="flex h-[calc(100vh-3.25rem)] min-h-0">
            <aside className="w-80 shrink-0 border-r border-border bg-white overflow-y-auto">
                <header className="px-4 py-3 border-b border-border">
                    <h1 className="text-[14px] font-semibold">Messages</h1>
                    <p className="text-[11.5px] text-muted-foreground">
                        Conversations from your applications.
                    </p>
                </header>
                {error && (
                    <div className="m-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                        {error}
                    </div>
                )}
                <ConversationList
                    items={conversations}
                    activeId={activeId}
                    loading={loading}
                    onSelect={setActiveId}
                />
            </aside>

            <main className="flex-1 min-w-0 flex flex-col">
                {activeId ? (
                    <ConversationView
                        key={activeId}
                        conversationId={activeId}
                        socket={socket}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">
                        Pick a conversation to start chatting.
                    </div>
                )}
            </main>
        </div>
    );
}
