"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { ConversationPeer } from "types";
import { usePresenceStore } from "@/src/store/usePresenceStore";
import { ChatAvatar } from "./ChatAvatar";

const ADMIN_PEER_ID = "SPIDERSKILL_ADMIN";

// sticky top bar with peer avatar, name, and live presence
export function ConversationHeader({
    peer,
    onBack,
    contextSubtitle = null,
}: {
    peer: ConversationPeer | null;
    onBack?: () => void;
    contextSubtitle?: string | null;
}) {
    const livePresence = usePresenceStore((s) =>
        peer ? s.presenceByUser[peer.id] : undefined,
    );

    if (!peer) {
        return (
            <header className="h-15 px-4 flex items-center gap-3 border-b border-border bg-white shrink-0">
                {onBack && <BackButton onClick={onBack} />}
                <div className="h-9 w-9 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                <div className="h-3 w-32 rounded-md bg-neutral-200 animate-pulse" />
            </header>
        );
    }
    const peerWithLivePresence: ConversationPeer = livePresence
        ? {
              ...peer,
              isOnline: livePresence.isOnline,
              lastSeenAt: livePresence.lastSeenAt,
          }
        : peer;
    const isDeleted = !!peer.deletedAt;
    const isAdminPeer = peer.id === ADMIN_PEER_ID;
    return (
        <header className="min-h-15 px-4 py-2 flex items-center gap-3 border-b border-border bg-white shrink-0">
            {onBack && <BackButton onClick={onBack} />}
            <ChatAvatar
                name={isDeleted ? "?" : peer.name}
                image={
                    isDeleted
                        ? null
                        : isAdminPeer
                          ? "/app-logos/logo.png"
                          : peer.image
                }
                size="sm"
                contain={isAdminPeer}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <div
                        className={
                            isDeleted
                                ? "text-[13.5px] font-semibold truncate leading-tight text-muted-foreground italic"
                                : "text-[13.5px] font-semibold truncate leading-tight"
                        }
                    >
                        {isDeleted
                            ? "Deleted account"
                            : (peer.name ?? "Unknown")}
                    </div>
                </div>
                {!isDeleted && !isAdminPeer && contextSubtitle && (
                    <div className="text-[11px] leading-tight text-muted-foreground truncate">
                        {contextSubtitle}
                    </div>
                )}
                {isDeleted ? (
                    <div className="text-[11px] leading-tight text-muted-foreground truncate">
                        This person deleted their account
                    </div>
                ) : isAdminPeer ? (
                    <div className="flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                        SpiderSkill support team
                    </div>
                ) : (
                    <PresenceSubtitle peer={peerWithLivePresence} />
                )}
            </div>
        </header>
    );
}

function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Back to conversations"
            className="md:hidden h-8 w-8 -ml-1 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
        >
            <ChevronLeft className="h-4 w-4" />
        </button>
    );
}

function PresenceSubtitle({ peer }: { peer: ConversationPeer }) {
    // tick once a minute so "last seen Xm ago" stays current
    const [, setTick] = useState(0);
    useEffect(() => {
        if (peer.isOnline) return;
        const id = setInterval(() => setTick((n) => n + 1), 60_000);
        return () => clearInterval(id);
    }, [peer.isOnline]);

    if (peer.isOnline) {
        return (
            <div className="flex items-center gap-1.5 text-[11px] leading-tight text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
            </div>
        );
    }
    const label = peer.lastSeenAt
        ? `Last seen ${formatLastSeen(peer.lastSeenAt)}`
        : "Offline";
    return (
        <div className="text-[11px] leading-tight text-muted-foreground truncate">
            {label}
        </div>
    );
}

// compact last-seen label for the chat header
function formatLastSeen(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "recently";
    const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(iso).toLocaleDateString();
}
