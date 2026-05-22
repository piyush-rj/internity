"use client";

import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConversationPeer } from "types";
import type { UserRole } from "@/src/lib/api/types";
import { useZegoCall } from "@/src/lib/call/ZegoCallProvider";
import { usePresenceStore } from "@/src/store/usePresenceStore";
import { cn } from "@/src/lib/utils";
import { ChatAvatar } from "./ChatAvatar";

/**
 * Sticky top bar above the chat thread. Shows the peer's avatar, name, and
 * live presence subtitle. Employers get a phone-icon call button on the
 * right — disabled while the peer is offline or the Zego SDK is still
 * warming up.
 */
export function ConversationHeader({
    peer,
    viewerRole,
}: {
    peer: ConversationPeer | null;
    /** Used to gate the call button — only employers may initiate calls. */
    viewerRole: UserRole | null;
}) {
    const livePresence = usePresenceStore((s) =>
        peer ? s.presenceByUser[peer.id] : undefined,
    );

    if (!peer) {
        return (
            <header className="h-15 px-4 flex items-center gap-3 border-b border-border bg-white shrink-0">
                <div className="h-9 w-9 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                <div className="h-3 w-32 rounded-md bg-neutral-200 animate-pulse" />
            </header>
        );
    }
    // Live store wins over the REST snapshot — peer presence flips the
    // instant a USER_PRESENCE event lands.
    const peerWithLivePresence: ConversationPeer = livePresence
        ? {
              ...peer,
              isOnline: livePresence.isOnline,
              lastSeenAt: livePresence.lastSeenAt,
          }
        : peer;
    return (
        <header className="h-15 px-4 flex items-center gap-3 border-b border-border bg-white shrink-0">
            <ChatAvatar name={peer.name} image={peer.image} size="sm" />
            <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold truncate leading-tight">
                    {peer.name ?? "Unknown"}
                </div>
                <PresenceSubtitle peer={peerWithLivePresence} />
            </div>
            {viewerRole === "EMPLOYER" && (
                <CallButton peer={peerWithLivePresence} />
            )}
        </header>
    );
}

function PresenceSubtitle({ peer }: { peer: ConversationPeer }) {
    // Force a re-render every minute so "Last seen Xm ago" keeps walking
    // forward even when no presence event arrives. Idle when the peer is
    // online — the label is static.
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

function CallButton({ peer }: { peer: ConversationPeer }) {
    const { ready, error, startCall } = useZegoCall();
    const [pending, setPending] = useState(false);

    const disabledReason = !peer.isOnline
        ? "User is offline"
        : !ready
          ? (error ?? "Connecting voice service…")
          : null;
    const disabled = disabledReason !== null || pending;

    async function onClick() {
        if (disabled) return;
        setPending(true);
        try {
            await startCall(peer);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Could not start the call.",
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={disabledReason ?? "Call applicant"}
            aria-label="Call applicant"
            className={cn(
                "h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors",
                disabled
                    ? "text-neutral-400 cursor-not-allowed"
                    : "text-emerald-600 hover:bg-emerald-50",
            )}
        >
            <Phone className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
    );
}

/** Compact "5m ago", "2h ago", "yesterday", or a date for the chat header. */
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
