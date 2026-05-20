"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
    ChatFilterMenu,
    type ChatFilter,
} from "@/src/components/chat/ChatFilterMenu";
import { ConversationList } from "@/src/components/chat/ConversationList";
import { ConversationView } from "@/src/components/chat/ConversationView";
import { chatApi, type ConversationListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useChatStore } from "@/src/store/useChatStore";
import { MESSAGE_TYPE } from "types";
import { cn } from "@/src/lib/utils";

export default function MessagesPage() {
    const socket = useWebSocket();
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedId = searchParams?.get("cid") ?? null;
    const clearUnread = useChatStore((s) => s.clearUnread);
    const unreadByConv = useChatStore((s) => s.unreadByConv);

    const [conversations, setConversations] = useState<ConversationListItem[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(requestedId);
    const [filter, setFilter] = useState<ChatFilter>("all");
    const [query, setQuery] = useState("");

    const refresh = useCallback(() => {
        chatApi
            .list_conversations()
            .then((rows) => {
                setError(null);
                setConversations(rows);
                // Keep the current selection if it still exists; otherwise leave
                // the right pane empty — never auto-pick the first conversation.
                setActiveId((curr) => {
                    if (curr && rows.some((c) => c.id === curr)) return curr;
                    return null;
                });
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

    // Escape closes the active conversation and returns to the empty state.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setActiveId(null);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Mirror the active conversation into the URL so a refresh restores it.
    useEffect(() => {
        const target = activeId
            ? `/home/messages?cid=${encodeURIComponent(activeId)}`
            : "/home/messages";
        router.replace(target, { scroll: false });
    }, [activeId, router]);

    // Mark the active conversation as read whenever it changes. Optimistic
    // local clear + server upsert; the server broadcasts CONVERSATION_READ
    // so the peer's tick flips.
    useEffect(() => {
        if (!activeId) return;
        clearUnread(activeId);
        chatApi.mark_read(activeId).catch(() => {
            /* silent — non-critical */
        });
    }, [activeId, clearUnread]);

    // Reorder + freshen the preview on every inbound message. Unread counts
    // are kept in sync by UnreadChatsBootstrap.
    useEffect(() => {
        return socket.addListener((msg) => {
            if (msg.type !== MESSAGE_TYPE.MESSAGE_CREATED) return;
            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) => c.id === msg.message.conversationId,
                );
                if (idx === -1) {
                    refresh();
                    return prev;
                }
                const updated: ConversationListItem = {
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
    }, [socket, refresh]);

    const unreadCountFor = useCallback(
        (id: string, fallback: number) => unreadByConv[id] ?? fallback,
        [unreadByConv],
    );

    const filteredConversations = useMemo(() => {
        const q = query.trim().toLowerCase();
        return conversations.filter((c) => {
            if (filter === "unread") {
                if (unreadCountFor(c.id, c.unreadCount) <= 0) return false;
            }
            if (q) {
                const haystack =
                    `${c.peer.name ?? ""} ${c.listingTitle} ${c.companyName}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [conversations, filter, query, unreadCountFor]);

    const totalUnread = useMemo(
        () =>
            conversations.reduce(
                (sum, c) => sum + unreadCountFor(c.id, c.unreadCount),
                0,
            ),
        [conversations, unreadCountFor],
    );

    async function handleMarkAllRead() {
        const unreadConvs = conversations.filter(
            (c) => unreadCountFor(c.id, c.unreadCount) > 0,
        );
        // Optimistic: clear locally first; server broadcasts will confirm.
        for (const c of unreadConvs) clearUnread(c.id);
        await Promise.all(
            unreadConvs.map((c) =>
                chatApi.mark_read(c.id).catch(() => {
                    /* silent */
                }),
            ),
        );
    }

    return (
        <div className="flex h-[calc(100vh-3.25rem)] min-h-0">
            <aside className="w-80 shrink-0 border-r border-border bg-white flex flex-col">
                <header className="px-4 pt-5 pb-3 space-y-3 border-b border-border">
                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-[22px] font-bold tracking-tight">
                            Chat
                        </h1>
                        <ChatFilterMenu
                            filter={filter}
                            onFilterChange={setFilter}
                            onMarkAllRead={handleMarkAllRead}
                            hasUnread={totalUnread > 0}
                        />
                    </div>
                    <SearchInput value={query} onChange={setQuery} />
                </header>

                {error && (
                    <div className="m-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <ConversationList
                        items={filteredConversations}
                        activeId={activeId}
                        loading={loading}
                        onSelect={setActiveId}
                    />
                    {!loading &&
                        !error &&
                        filteredConversations.length === 0 &&
                        conversations.length > 0 && (
                            <div className="px-6 py-8 text-center text-[12.5px] text-muted-foreground">
                                {filter === "unread"
                                    ? "Nothing unread."
                                    : "No matches."}
                            </div>
                        )}
                </div>
            </aside>

            <main className="flex-1 min-w-0 flex flex-col">
                {activeId ? (
                    <ConversationView
                        key={activeId}
                        conversationId={activeId}
                        conversation={
                            conversations.find((c) => c.id === activeId) ?? null
                        }
                        socket={socket}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1 px-6 text-center">
                        <div className="text-[14px] font-medium">
                            No conversation selected
                        </div>
                        <div className="text-[12.5px] text-muted-foreground">
                            Select a chat from the left to view messages.
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SearchInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label
            className={cn(
                "flex items-center gap-2 h-9 px-3 rounded-full",
                "bg-secondary/60 text-[13px]",
                "focus-within:ring-2 focus-within:ring-foreground/10",
            )}
        >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
        </label>
    );
}
