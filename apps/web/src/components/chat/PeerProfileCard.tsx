"use client";

import Link from "next/link";
import type { ConversationPeer } from "types";
import { ChatAvatar } from "./ChatAvatar";
import { cn } from "@/src/lib/utils";

// profile header card at top of message scroll area
export function PeerProfileCard({
    peer,
    subtitle,
    viewProfileHref,
    isAdminView = false,
}: {
    peer: ConversationPeer | null;
    subtitle: string | null;
    viewProfileHref: string | null;
    isAdminView?: boolean;
}) {
    if (!peer) return null;
    const isDeleted = !!peer.deletedAt;
    const isAdminPeer = peer.id === "SPIDERSKILL_ADMIN";
    return (
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
            <ChatAvatar
                name={isDeleted ? "?" : peer.name}
                image={
                    isDeleted
                        ? null
                        : isAdminPeer
                          ? "/app-logos/logo.png"
                          : peer.image
                }
                size="lg"
                contain={isAdminPeer}
            />
            <h2
                className={cn(
                    "mt-3 text-[16px] font-semibold tracking-tight",
                    isDeleted && "text-muted-foreground italic",
                )}
            >
                {isDeleted ? "Deleted account" : (peer.name ?? "Unknown")}
            </h2>
            {isAdminView && !isDeleted && !isAdminPeer && peer.email && (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {peer.email}
                </p>
            )}
            {isDeleted ? (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    This person deleted their account. Their messages stay on
                    record but you can&rsquo;t reach them anymore.
                </p>
            ) : (
                subtitle && (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {subtitle}
                    </p>
                )
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

// builds the subtitle for the peer profile card
export function buildPeerSubtitle({
    listingTitle,
    companyName,
    otherRolesCount,
}: {
    listingTitle: string | null;
    companyName: string | null;
    otherRolesCount: number;
}): string | null {
    const parts = [listingTitle, companyName].filter((v): v is string => !!v);
    if (parts.length === 0) return null;
    const base = parts.join(" · ");
    return otherRolesCount > 0
        ? `${base} · +${otherRolesCount} more role${otherRolesCount === 1 ? "" : "s"}`
        : base;
}
