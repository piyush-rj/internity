"use client";

import Link from "next/link";
import type { ConversationPeer } from "types";
import { ChatAvatar } from "./ChatAvatar";
import { cn } from "@/src/lib/utils";

/**
 * Profile header card shown at the top of the message scroll area — large
 * avatar, peer name, contextual subtitle (email or listing/company), and an
 * optional "View Profile" link.
 */
export function PeerProfileCard({
    peer,
    subtitle,
    viewProfileHref,
}: {
    peer: ConversationPeer | null;
    subtitle: string | null;
    viewProfileHref: string | null;
}) {
    if (!peer) return null;
    return (
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
            <ChatAvatar name={peer.name} image={peer.image} size="lg" />
            <h2 className="mt-3 text-[16px] font-semibold tracking-tight">
                {peer.name ?? "Unknown"}
            </h2>
            {subtitle && (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {subtitle}
                </p>
            )}
            {viewProfileHref && (
                <Link
                    href={viewProfileHref}
                    className={cn(
                        "mt-4 inline-flex items-center h-8 px-4 rounded-full",
                        "bg-foreground text-background text-[12.5px] font-semibold",
                        "hover:bg-foreground/90 transition-colors",
                    )}
                >
                    View Profile
                </Link>
            )}
        </div>
    );
}

/**
 * Subtitle for the profile card.
 *   - Employer-viewing-student → student's email (their identifier).
 *   - Student-viewing-employer → listing title · company name.
 *   - Otherwise → null (no subtitle).
 */
export function buildPeerSubtitle({
    peerEmail,
    listingTitle,
    companyName,
    viewerRole,
}: {
    peerEmail: string | null;
    listingTitle: string | null;
    companyName: string | null;
    viewerRole: string | null;
}): string | null {
    if (viewerRole === "EMPLOYER" && peerEmail) return peerEmail;
    const parts = [listingTitle, companyName].filter((v): v is string => !!v);
    return parts.length > 0 ? parts.join(" · ") : null;
}
