"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, Trash2 } from "lucide-react";
import {
    PiBriefcase,
    PiClock,
    PiCurrencyInr,
    PiMapPin,
    PiUsers,
} from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ApiClientError } from "@/src/lib/apiClient";
import type { MyListing } from "@/src/hooks/useMyListings";
import { useConfirm } from "@/src/hooks/useConfirm";
import { cn } from "@/src/lib/utils";

type BusyKind =
    | "close"
    | "reopen"
    | "renew"
    | "pause"
    | "unpause"
    | "remove"
    | null;

export function MyListingCard({
    listing,
    onClose,
    onReopen,
    onRenew,
    onPause,
    onUnpause,
    onRemove,
}: {
    listing: MyListing;
    onClose: (id: string) => Promise<void>;
    onReopen: (id: string) => Promise<void>;
    onRenew: (id: string) => Promise<void>;
    onPause: (id: string) => Promise<void>;
    onUnpause: (id: string) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}) {
    const closed = !!listing.closedAt;
    const takenDown = !!listing.takenDownAt;
    const paused = !!listing.pausedAt;
    const expired = isExpired(listing.expiresAt);
    const expiringSoon = !expired && isExpiringSoon(listing.expiresAt);
    const [busy, setBusy] = useState<BusyKind>(null);
    const { confirm, dialogProps } = useConfirm();

    async function run<T>(kind: BusyKind, fn: () => Promise<T>) {
        if (busy) return;
        setBusy(kind);
        try {
            await fn();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Something went wrong. Try again.",
            );
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {takenDown ? (
                        <span className="text-[14px] font-medium text-muted-foreground line-through truncate">
                            {listing.title}
                        </span>
                    ) : (
                        <Link
                            href={`/home/listings/${listing.id}`}
                            className="text-[14px] font-medium text-foreground truncate hover:underline"
                        >
                            {listing.title}
                        </Link>
                    )}
                    <TypeBadge type={listing.type} />
                    <ModeBadge mode={listing.mode} />
                    <StatusBadge
                        closed={closed}
                        takenDown={takenDown}
                        paused={paused}
                        expired={expired}
                    />
                    {expiringSoon && (
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            Expires {formatExpiresAt(listing.expiresAt)}
                        </span>
                    )}
                </div>
                {takenDown && listing.takedownReason && (
                    <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-red-700">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="leading-snug">
                            <span className="font-medium">
                                Removed by admin:
                            </span>{" "}
                            {listing.takedownReason}
                        </span>
                    </div>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                    <Meta
                        icon={<PiUsers className="h-3 w-3" />}
                        text={`${listing._count?.applications ?? 0} applicants`}
                        href={`/home/applicants?listingId=${listing.id}`}
                    />
                    {(listing.stipendMin || listing.stipendMax) && (
                        <Meta
                            icon={<PiCurrencyInr className="h-3 w-3" />}
                            text={`${formatStipend(listing.stipendMin, listing.stipendMax)}/mo`}
                        />
                    )}
                    {listing.durationMonths && (
                        <Meta
                            icon={<PiClock className="h-3 w-3" />}
                            text={`${listing.durationMonths} months`}
                        />
                    )}
                    {listing.city && (
                        <Meta
                            icon={<PiMapPin className="h-3 w-3" />}
                            text={listing.city}
                        />
                    )}
                    {listing.openings && (
                        <Meta
                            icon={<PiBriefcase className="h-3 w-3" />}
                            text={`${listing.openings} ${listing.openings === 1 ? "opening" : "openings"}`}
                        />
                    )}
                </div>
            </div>

            {!takenDown && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {expired ? (
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={() =>
                                run("renew", () => onRenew(listing.id))
                            }
                            disabled={!!busy}
                            className="h-8 px-2.5 text-[12px] cursor-pointer"
                        >
                            {busy === "renew" ? "…" : "Renew 30d"}
                        </Button>
                    ) : paused ? (
                        <Button
                            type="button"
                            variant="exec-light"
                            onClick={() =>
                                run("unpause", () => onUnpause(listing.id))
                            }
                            disabled={!!busy}
                            className="h-8 px-2.5 text-[12px] cursor-pointer"
                        >
                            {busy === "unpause" ? "…" : "Resume hiring"}
                        </Button>
                    ) : closed ? (
                        <Button
                            type="button"
                            variant="exec-light"
                            onClick={() =>
                                run("reopen", () => onReopen(listing.id))
                            }
                            disabled={!!busy}
                            className="h-8 px-2.5 text-[12px] cursor-pointer"
                        >
                            {busy === "reopen" ? "…" : "Reopen"}
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="exec-light"
                                onClick={() =>
                                    run("pause", () => onPause(listing.id))
                                }
                                disabled={!!busy}
                                className="h-8 px-2.5 text-[12px] cursor-pointer"
                            >
                                {busy === "pause" ? "…" : "Pause"}
                            </Button>
                            <Button
                                type="button"
                                variant="exec-light"
                                onClick={() =>
                                    run("close", () => onClose(listing.id))
                                }
                                disabled={!!busy}
                                className="h-8 px-2.5 text-[12px] cursor-pointer"
                            >
                                {busy === "close" ? "…" : "Close"}
                            </Button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={async () => {
                            const ok = await confirm({
                                title: `Delete "${listing.title}"?`,
                                description:
                                    "Applicants and all data for this listing will be removed. This can’t be undone.",
                                confirmLabel: "Delete listing",
                                variant: "destructive",
                            });
                            if (ok) {
                                run("remove", () => onRemove(listing.id));
                            }
                        }}
                        aria-label="Delete listing"
                        disabled={!!busy}
                        className={cn(
                            "h-8 w-8 inline-flex items-center justify-center rounded-md",
                            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                            "transition-colors disabled:opacity-50",
                        )}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

function StatusBadge({
    closed,
    takenDown,
    paused,
    expired,
}: {
    closed: boolean;
    takenDown: boolean;
    paused: boolean;
    expired: boolean;
}) {
    if (takenDown) {
        return (
            <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                Removed by admin
            </span>
        );
    }
    if (expired) {
        return (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                Expired
            </span>
        );
    }
    if (paused) {
        return (
            <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                Paused
            </span>
        );
    }
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                closed
                    ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
            )}
        >
            {closed ? "Closed" : "Open"}
        </span>
    );
}

function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= Date.now();
}

function isExpiringSoon(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    return diffMs > 0 && diffMs <= 3 * 24 * 60 * 60 * 1000;
}

function formatExpiresAt(iso: string | null): string {
    if (!iso) return "";
    const diffMs = new Date(iso).getTime() - Date.now();
    if (diffMs <= 0) return "now";
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (days >= 1) return `in ${days}d`;
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
    return `in ${hours}h`;
}

function TypeBadge({ type }: { type: MyListing["type"] }) {
    return (
        <span className="rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {type === "INTERNSHIP" ? "Internship" : "Job"}
        </span>
    );
}

function ModeBadge({ mode }: { mode: MyListing["mode"] }) {
    const styles: Record<typeof mode, string> = {
        REMOTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
        HYBRID: "bg-amber-50 text-amber-700 border-amber-200",
        ONSITE: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };
    const labels: Record<typeof mode, string> = {
        REMOTE: "Remote",
        HYBRID: "Hybrid",
        ONSITE: "On-site",
    };
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                styles[mode],
            )}
        >
            {labels[mode]}
        </span>
    );
}

function Meta({
    icon,
    text,
    href,
}: {
    icon: React.ReactNode;
    text: string;
    href?: string;
}) {
    const content = (
        <span className="inline-flex items-center gap-1">
            {icon}
            {text}
            {href && <ChevronRight className="h-2.5 w-2.5" />}
        </span>
    );
    if (href) {
        return (
            <Link
                href={href}
                className="hover:text-foreground transition-colors"
            >
                {content}
            </Link>
        );
    }
    return content;
}

function formatStipend(min: number | null, max: number | null): string {
    if (min && max && min !== max)
        return `₹${formatNum(min)}–${formatNum(max)}`;
    const v = max ?? min;
    return v ? `₹${formatNum(v)}` : "—";
}

function formatNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return String(n);
}
