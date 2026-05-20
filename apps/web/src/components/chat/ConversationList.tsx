"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { ConversationListItem } from "@/src/lib/api";
import { useChatStore } from "@/src/store/useChatStore";
import { cn } from "@/src/lib/utils";

export function ConversationList({
    items,
    activeId,
    loading,
    onSelect,
    onRefresh,
}: {
    items: ConversationListItem[];
    activeId: string | null;
    loading: boolean;
    onSelect: (id: string) => void;
    onRefresh?: () => void;
}) {
    useEffect(() => {
        onRefresh?.();
    }, [onRefresh]);

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
                No conversations yet. Apply to a listing to start chatting with
                the company.
            </div>
        );
    }

    return (
        <ul className="divide-y divide-border">
            {items.map((c) => (
                <ConversationRow
                    key={c.id}
                    item={c}
                    active={activeId === c.id}
                    onSelect={() => onSelect(c.id)}
                />
            ))}
        </ul>
    );
}

function ConversationRow({
    item,
    active,
    onSelect,
}: {
    item: ConversationListItem;
    active: boolean;
    onSelect: () => void;
}) {
    // Live unread count from the store; falls back to the value the API
    // returned so the badge is correct on first paint.
    const unread = useChatStore(
        (s) => s.unreadByConv[item.id] ?? item.unreadCount,
    );
    const hasUnread = !active && unread > 0;
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
                    <PeerAvatar name={item.peer.name} image={item.peer.image} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                            <span
                                className={cn(
                                    "text-[14px] truncate",
                                    hasUnread
                                        ? "font-semibold text-foreground"
                                        : "font-semibold",
                                )}
                            >
                                {item.peer.name ?? "Unknown"}
                            </span>
                            <span className="text-[10.5px] text-muted-foreground shrink-0">
                                {formatRelative(item.lastMessageAt)}
                            </span>
                        </div>
                        {/* <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                            {item.listingTitle} · {item.companyName}
                        </div> */}
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

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86_400) return `${Math.floor(sec / 3600)}h`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
