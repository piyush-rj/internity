"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { ConversationListItem } from "@/src/lib/api";
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
                <li key={c.id}>
                    <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className={cn(
                            "w-full text-left px-3 py-3",
                            "transition-colors cursor-pointer",
                            activeId === c.id
                                ? "bg-secondary/70"
                                : "hover:bg-secondary/40",
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <PeerAvatar
                                name={c.peer.name}
                                image={c.peer.image}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[13px] font-semibold truncate">
                                        {c.peer.name ?? "Unknown"}
                                    </span>
                                    <span className="text-[10.5px] text-muted-foreground shrink-0">
                                        {formatRelative(c.lastMessageAt)}
                                    </span>
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                                    {c.listingTitle} · {c.companyName}
                                </div>
                                {c.lastMessagePreview && (
                                    <div className="mt-1 text-[12px] text-foreground/80 truncate">
                                        {c.lastMessagePreview}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
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
        <span className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
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
