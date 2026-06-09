"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ConversationView } from "@/src/components/chat/ConversationView";
import { chatApi, type ConversationListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useChatStore } from "@/src/store/useChatStore";
import { MESSAGE_TYPE } from "types";
import { cn } from "@/src/lib/utils";

export default function SupportRequestsPage() {
    return (
        <Suspense fallback={null}>
            <SupportRequestsView />
        </Suspense>
    );
}

type RoleFilter = "all" | "STUDENT" | "EMPLOYER";

function SupportRequestsView() {
    const socket = useWebSocket();
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedId = searchParams?.get("cid") ?? null;
    const clearUnread = useChatStore((s) => s.clearUnread);
    const unreadByConv = useChatStore((s) => s.unreadByConv);

    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(requestedId);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [query, setQuery] = useState("");

    const refresh = useCallback(() => {
        chatApi
            .list_conversations()
            .then((rows) => {
                setError(null);
                // Only show admin threads that have at least one message
                const adminRows = rows.filter(
                    (c) => c.isAdminThread && c.lastMessagePreview !== null,
                );
                setConversations(adminRows);
                setActiveId((curr) => {
                    if (curr && adminRows.some((c) => c.id === curr)) return curr;
                    return null;
                });
            })
            .catch((err) => {
                setError(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn't load conversations.",
                );
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // sync activeId on same-page navigation
    useEffect(() => {
        if (requestedId) {
            setActiveId(requestedId);
            refresh();
        }
    }, [requestedId, refresh]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setActiveId(null);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        const target = activeId
            ? `/admin/support-requests?cid=${encodeURIComponent(activeId)}`
            : "/admin/support-requests";
        router.replace(target, { scroll: false });
    }, [activeId, router]);

    useEffect(() => {
        if (!activeId) return;
        clearUnread(activeId);
        chatApi.mark_read(activeId).catch(() => {});
    }, [activeId, clearUnread]);

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
            if (roleFilter !== "all" && c.peerRole !== roleFilter) return false;
            if (q) {
                const haystack = (c.peer.name ?? "").toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [conversations, roleFilter, query]);

    return (
        <div className="flex h-[calc(100vh-3.25rem)] min-h-0">
            {/* Left sidebar */}
            <aside
                className={cn(
                    "w-full md:w-80 shrink-0 border-r border-border bg-white flex-col",
                    activeId ? "hidden md:flex" : "flex",
                )}
            >
                <header className="px-4 pt-5 pb-3 space-y-3 border-b border-border">
                    <h1 className="text-[22px] font-bold tracking-tight">
                        Support Requests
                    </h1>
                    <SearchInput value={query} onChange={setQuery} />
                    <RoleFilterTabs value={roleFilter} onChange={setRoleFilter} />
                </header>

                {error && (
                    <div className="m-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <SupportConversationList
                        items={filteredConversations}
                        activeId={activeId}
                        loading={loading}
                        unreadCountFor={unreadCountFor}
                        onSelect={setActiveId}
                    />
                    {!loading && !error && filteredConversations.length === 0 && conversations.length > 0 && (
                        <div className="px-6 py-8 text-center text-[12.5px] text-muted-foreground">
                            No matches.
                        </div>
                    )}
                </div>
            </aside>

            {/* Right chat panel */}
            <main
                className={cn(
                    "flex-1 min-w-0 flex-col",
                    activeId ? "flex" : "hidden md:flex",
                )}
            >
                {activeId ? (
                    <ConversationView
                        key={activeId}
                        conversationId={activeId}
                        conversation={conversations.find((c) => c.id === activeId) ?? null}
                        socket={socket}
                        onBack={() => setActiveId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1 px-6 text-center">
                        <div className="text-[14px] font-medium">
                            No conversation selected
                        </div>
                        <div className="text-[12.5px] text-muted-foreground">
                            Select a support request to view messages.
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function RoleFilterTabs({
    value,
    onChange,
}: {
    value: RoleFilter;
    onChange: (v: RoleFilter) => void;
}) {
    const tabs: { label: string; value: RoleFilter }[] = [
        { label: "All", value: "all" },
        { label: "Students", value: "STUDENT" },
        { label: "Founders", value: "EMPLOYER" },
    ];
    return (
        <div className="flex gap-1.5">
            {tabs.map((t) => (
                <button
                    key={t.value}
                    type="button"
                    onClick={() => onChange(t.value)}
                    className={cn(
                        "h-7 px-3 rounded-full text-[12px] font-medium transition-colors",
                        value === t.value
                            ? "bg-foreground text-background"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                    )}
                >
                    {t.label}
                </button>
            ))}
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

function SupportConversationList({
    items,
    activeId,
    loading,
    unreadCountFor,
    onSelect,
}: {
    items: ConversationListItem[];
    activeId: string | null;
    loading: boolean;
    unreadCountFor: (id: string, fallback: number) => number;
    onSelect: (id: string) => void;
}) {
    if (loading && items.length === 0) {
        return (
            <div className="flex flex-col gap-1.5 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 w-full rounded-md bg-secondary/60 animate-pulse" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="p-6 text-center text-[12.5px] text-muted-foreground">
                No support requests yet.
            </div>
        );
    }

    return (
        <ul className="divide-y divide-border">
            {items.map((c) => (
                <SupportConversationRow
                    key={c.id}
                    item={c}
                    active={activeId === c.id}
                    unread={unreadCountFor(c.id, c.unreadCount)}
                    onSelect={() => onSelect(c.id)}
                />
            ))}
        </ul>
    );
}

function SupportConversationRow({
    item,
    active,
    unread,
    onSelect,
}: {
    item: ConversationListItem;
    active: boolean;
    unread: number;
    onSelect: () => void;
}) {
    const hasUnread = !active && unread > 0;
    const isDeleted = !!item.peer.deletedAt;

    return (
        <li>
            <button
                type="button"
                onClick={onSelect}
                className={cn(
                    "w-full text-left px-3 py-3",
                    "transition-colors cursor-pointer",
                    active ? "bg-secondary/70" : "hover:bg-secondary/40",
                )}
            >
                <div className="flex items-center gap-3">
                    <PeerAvatar name={isDeleted ? null : item.peer.name} image={isDeleted ? null : item.peer.image} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                    className={cn(
                                        "text-[14px] truncate font-semibold",
                                        isDeleted && "text-muted-foreground italic",
                                    )}
                                >
                                    {isDeleted ? "Deleted account" : (item.peer.name ?? "Unknown")}
                                </span>
                                {!isDeleted && item.peerRole && (
                                    <RoleBadge role={item.peerRole} />
                                )}
                            </div>
                            <span className="text-[10.5px] text-muted-foreground shrink-0">
                                {formatRelative(item.lastMessageAt)}
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            {item.lastMessagePreview ? (
                                <div
                                    className={cn(
                                        "flex-1 min-w-0 text-[12px] truncate",
                                        hasUnread
                                            ? "text-foreground font-medium"
                                            : "text-foreground/80",
                                    )}
                                >
                                    {item.lastMessagePreview}
                                </div>
                            ) : (
                                <div className="flex-1" />
                            )}
                            {hasUnread && (
                                <span className="min-w-5 h-5 inline-flex items-center justify-center px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-semibold tabular-nums shrink-0">
                                    {unread > 99 ? "99+" : unread}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        </li>
    );
}

function PeerAvatar({ name, image }: { name: string | null; image: string | null }) {
    const initial = (name ?? "U")[0]?.toUpperCase() ?? "U";
    return (
        <span className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
            {image ? (
                <Image src={image} alt={name ?? "user"} fill unoptimized className="object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-400 to-violet-500 text-white text-[13px] font-semibold">
                    {initial}
                </span>
            )}
        </span>
    );
}

function RoleBadge({ role }: { role: string }) {
    if (role === "STUDENT") {
        return (
            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                Student
            </span>
        );
    }
    if (role === "EMPLOYER") {
        return (
            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
                Founder
            </span>
        );
    }
    return null;
}

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86_400) return `${Math.floor(sec / 3600)}h`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
