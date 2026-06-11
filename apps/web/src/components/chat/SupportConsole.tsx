"use client";

import Image from "next/image";
import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { ConversationView } from "@/src/components/chat/ConversationView";
import { chatApi, type ConversationListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useChatStore } from "@/src/store/useChatStore";
import { MESSAGE_TYPE } from "types";
import { cn } from "@/src/lib/utils";

type UserSearchResult = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    companyName: string | null;
    conversationId: string | null;
};

// Shared support-chat console. Used by both the admin panel
// (/admin/support-requests) and the dedicated support-agent console (/support).
// `basePath` is the route the active conversation id is reflected into.
export function SupportConsole({
    basePath,
    readOnly = false,
}: {
    basePath: string;
    readOnly?: boolean;
}) {
    return (
        <Suspense fallback={null}>
            <SupportConsoleView basePath={basePath} readOnly={readOnly} />
        </Suspense>
    );
}

type RoleFilter = "all" | "STUDENT" | "EMPLOYER";

function SupportConsoleView({
    basePath,
    readOnly,
}: {
    basePath: string;
    readOnly: boolean;
}) {
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
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [initiating, setInitiating] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // Debounced server search
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        const t = setTimeout(() => {
            setSearchLoading(true);
            chatApi
                .admin_search_users(q)
                .then((res) => {
                    setSearchResults(res.users);
                    setSearchOpen(true);
                })
                .catch(() => {})
                .finally(() => setSearchLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    // Close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (
                searchWrapperRef.current &&
                !searchWrapperRef.current.contains(e.target as Node)
            ) {
                setSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    function injectConversation(convId: string, user: UserSearchResult) {
        setConversations((prev) => {
            if (prev.some((c) => c.id === convId)) return prev;
            const synthetic: ConversationListItem = {
                id: convId,
                isAdminThread: true,
                applicationId: null,
                applicationStatus: null,
                listingId: null,
                listingTitle: null,
                companyName: user.companyName,
                otherRolesCount: 0,
                peer: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    isOnline: false,
                    lastSeenAt: null,
                    deletedAt: null,
                },
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: null,
                unreadCount: 0,
                peerLastReadAt: null,
                peerRole: user.role,
            };
            return [synthetic, ...prev];
        });
    }

    async function handleSelectUser(user: UserSearchResult) {
        setSearchOpen(false);
        setQuery("");
        if (user.conversationId) {
            injectConversation(user.conversationId, user);
            setActiveId(user.conversationId);
            return;
        }
        setInitiating(true);
        try {
            const { id } = await chatApi.admin_initiate_conversation(user.id);
            injectConversation(id, user);
            setActiveId(id);
        } catch {
            // ignore
        } finally {
            setInitiating(false);
        }
    }

    function refresh() {
        chatApi
            .list_conversations()
            .then((rows) => {
                setError(null);
                // Only show admin threads that have at least one message
                const adminRows = rows.filter(
                    (c) => c.isAdminThread && c.lastMessagePreview !== null,
                );
                setConversations(adminRows);
            })
            .catch((err) => {
                setError(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn't load conversations.",
                );
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        refresh();
    }, []);

    // sync activeId on same-page navigation (no refresh — initial load covers it)
    useEffect(() => {
        if (requestedId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveId(requestedId);
        }
    }, [requestedId]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setActiveId(null);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        const target = activeId
            ? `${basePath}?cid=${encodeURIComponent(activeId)}`
            : basePath;
        router.replace(target, { scroll: false });
    }, [activeId, router, basePath]);

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
    }, [socket]);

    const unreadCountFor = useCallback(
        (id: string, fallback: number) => unreadByConv[id] ?? fallback,
        [unreadByConv],
    );

    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            if (roleFilter !== "all" && c.peerRole !== roleFilter) return false;
            return true;
        });
    }, [conversations, roleFilter]);

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
                    <AdminSearchBox
                        value={query}
                        onChange={setQuery}
                        results={searchResults}
                        loading={searchLoading}
                        open={searchOpen}
                        initiating={initiating}
                        wrapperRef={searchWrapperRef}
                        onSelect={handleSelectUser}
                        onClose={() => setSearchOpen(false)}
                    />
                    <RoleFilterTabs
                        value={roleFilter}
                        onChange={setRoleFilter}
                    />
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
                    {!loading &&
                        !error &&
                        filteredConversations.length === 0 &&
                        conversations.length > 0 && (
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
                        conversation={
                            conversations.find((c) => c.id === activeId) ?? null
                        }
                        socket={socket}
                        onBack={() => setActiveId(null)}
                        isAdminView={readOnly}
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

function AdminSearchBox({
    value,
    onChange,
    results,
    loading,
    open,
    initiating,
    wrapperRef,
    onSelect,
    onClose,
}: {
    value: string;
    onChange: (v: string) => void;
    results: UserSearchResult[];
    loading: boolean;
    open: boolean;
    initiating: boolean;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    onSelect: (user: UserSearchResult) => void;
    onClose: () => void;
}) {
    return (
        <div ref={wrapperRef} className="relative">
            <label
                className={cn(
                    "flex items-center gap-2 h-9 px-3 rounded-full",
                    "bg-secondary/60 text-[13px]",
                    "focus-within:ring-2 focus-within:ring-foreground/10",
                )}
            >
                {loading || initiating ? (
                    <Loader2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 animate-spin" />
                ) : (
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <input
                    type="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() =>
                        value.trim() && results.length > 0 && onClose()
                    }
                    placeholder="Search by name, email, company…"
                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
            </label>

            {open && value.trim().length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-white shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="px-4 py-3 text-[12.5px] text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <ul>
                            {results.map((u) => (
                                <li key={u.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => onSelect(u)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                                    >
                                        <UserAvatar
                                            name={u.name}
                                            image={u.image}
                                            size={32}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[13px] font-medium truncate">
                                                    {u.name ?? "Unknown"}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "shrink-0 inline-flex items-center h-4.5 px-1.5 rounded-full text-[10px] font-medium",
                                                        u.role === "STUDENT"
                                                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                                                            : "bg-orange-50 text-orange-600 border border-orange-200",
                                                    )}
                                                >
                                                    {u.role === "STUDENT"
                                                        ? "Student"
                                                        : "Founder"}
                                                </span>
                                            </div>
                                            <div className="text-[11.5px] text-muted-foreground truncate">
                                                {u.companyName
                                                    ? `${u.companyName}${u.email ? ` · ${u.email}` : ""}`
                                                    : (u.email ?? "")}
                                            </div>
                                        </div>
                                        <span
                                            className={cn(
                                                "shrink-0 text-[10.5px] font-medium",
                                                u.conversationId
                                                    ? "text-green-600"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {u.conversationId
                                                ? "Open chat"
                                                : "New chat"}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

function UserAvatar({
    name,
    image,
    size,
}: {
    name: string | null;
    image: string | null;
    size: number;
}) {
    const initial = (name ?? "U")[0]?.toUpperCase() ?? "U";
    return (
        <span
            className="relative rounded-full overflow-hidden shrink-0 ring-1 ring-border"
            style={{ width: size, height: size }}
        >
            {image ? (
                <Image
                    src={image}
                    alt={name ?? "user"}
                    fill
                    unoptimized
                    className="object-cover"
                />
            ) : (
                <span
                    className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-400 to-violet-500 text-white font-semibold"
                    style={{ fontSize: size * 0.35 }}
                >
                    {initial}
                </span>
            )}
        </span>
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
                    <div
                        key={i}
                        className="h-14 w-full rounded-md bg-secondary/60 animate-pulse"
                    />
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
                    <PeerAvatar
                        name={isDeleted ? null : item.peer.name}
                        image={isDeleted ? null : item.peer.image}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                    className={cn(
                                        "text-[14px] truncate font-semibold",
                                        isDeleted &&
                                            "text-muted-foreground italic",
                                    )}
                                >
                                    {isDeleted
                                        ? "Deleted account"
                                        : (item.peer.name ?? "Unknown")}
                                </span>
                                {!isDeleted && item.peerRole && (
                                    <RoleBadge role={item.peerRole} />
                                )}
                            </div>
                            <span className="text-[10.5px] text-muted-foreground shrink-0">
                                {formatRelative(item.lastMessageAt)}
                            </span>
                        </div>
                        {!isDeleted && item.companyName && (
                            <div className="text-[11.5px] text-muted-foreground truncate -mt-0.5">
                                {item.companyName}
                            </div>
                        )}
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

function PeerAvatar({
    name,
    image,
}: {
    name: string | null;
    image: string | null;
}) {
    const initial = (name ?? "U")[0]?.toUpperCase() ?? "U";
    return (
        <span className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
            {image ? (
                <Image
                    src={image}
                    alt={name ?? "user"}
                    fill
                    unoptimized
                    className="object-cover"
                />
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
