"use client";

import type { ConversationPeer } from "types";
import { ChatAvatar } from "./ChatAvatar";

/**
 * Sticky top bar above the chat thread. Shows the peer's avatar + name —
 * a pulsing skeleton while the conversation metadata is still loading.
 */
export function ConversationHeader({
    peer,
}: {
    peer: ConversationPeer | null;
}) {
    if (!peer) {
        return (
            <header className="h-15 px-4 flex items-center gap-3 border-b border-border bg-white shrink-0">
                <div className="h-9 w-9 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                <div className="h-3 w-32 rounded-md bg-neutral-200 animate-pulse" />
            </header>
        );
    }
    return (
        <header className="h-15 px-4 flex items-center gap-3 border-b border-border bg-white shrink-0">
            <ChatAvatar name={peer.name} image={peer.image} size="sm" />
            <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold truncate">
                    {peer.name ?? "Unknown"}
                </div>
            </div>
        </header>
    );
}
