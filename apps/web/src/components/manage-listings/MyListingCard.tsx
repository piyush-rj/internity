"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, Pencil, Trash2 } from "lucide-react";
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
import { formatDuration } from "@/src/lib/format/duration";
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

    const applicants = listing._count?.applications ?? 0;
    const unseen = Math.max(
        0,
        applicants - (listing._count?.applicationsSeen ?? 0),
    );

    return (
        <article
            className={cn(
                "rounded-lg border border-border bg-card p-4 sm:p-5",
                "hover:shadow-sm transition-shadow",
                takenDown && "border-red-200 bg-red-50/30",
            )}
        >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {takenDown ? (
                            <span className="text-[16px] font-semibold text-muted-foreground line-through truncate">
                                {listing.title}
                            </span>
                        ) : (
                            <Link
                                href={`/home/listings/${listing.id}`}
                                className="text-[16px] font-semibold text-foreground truncate hover:text-orange-600 transition-colors"
                            >
                                {listing.title}
                            </Link>
                        )}
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

                    {listing.description && (
                        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
                            {listing.description}
                        </p>
                    )}

                    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-foreground/80">
                        <li>
                            <ApplicantsLink
                                listingId={listing.id}
                                applicants={applicants}
                                unseen={unseen}
                            />
                        </li>
                        {(listing.stipendMin || listing.stipendMax) && (
                            <li className="inline-flex items-center gap-1.5 tabular-nums">
                                <PiCurrencyInr className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {formatStipend(
                                        listing.stipendMin,
                                        listing.stipendMax,
                                    )}{" "}
                                    /mo
                                </span>
                            </li>
                        )}
                        {formatDuration(
                            listing.durationMonths,
                            listing.durationWeeks,
                        ) && (
                            <li className="inline-flex items-center gap-1.5 tabular-nums">
                                <PiClock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {formatDuration(
                                        listing.durationMonths,
                                        listing.durationWeeks,
                                    )}
                                </span>
                            </li>
                        )}
                        {(listing.city || listing.mode === "REMOTE") && (
                            <li className="inline-flex items-center gap-1.5">
                                <PiMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate max-w-50">
                                    {listing.mode === "REMOTE"
                                        ? "Work from home"
                                        : listing.city}
                                </span>
                            </li>
                        )}
                        {listing.openings && (
                            <li className="inline-flex items-center gap-1.5 tabular-nums">
                                <PiBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {listing.openings}{" "}
                                    {listing.openings === 1
                                        ? "opening"
                                        : "openings"}
                                </span>
                            </li>
                        )}
                    </ul>

                    {listing.skillTagsRaw.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {listing.skillTagsRaw.slice(0, 6).map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/60 text-foreground/80 text-[11px]"
                                >
                                    {skill}
                                </span>
                            ))}
                            {listing.skillTagsRaw.length > 6 && (
                                <span className="text-[11px] text-muted-foreground self-center">
                                    +{listing.skillTagsRaw.length - 6} more
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 font-medium">
                            <PiClock className="h-3 w-3" />
                            Posted {timeAgo(listing.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            {!takenDown && (
                <div className="mt-3 pt-3 flex items-center justify-end gap-2 flex-wrap">
                    <Link
                        href={`/home/manage-listings/${listing.id}`}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[12.5px] font-medium bg-background text-foreground hover:bg-secondary transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {expired ? (
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={() =>
                                run("renew", () => onRenew(listing.id))
                            }
                            disabled={!!busy}
                            className="h-9 px-3.5 text-[12.5px] rounded-md cursor-pointer"
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
                            className="h-9 px-3.5 text-[12.5px] rounded-md cursor-pointer"
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
                            className="h-9 px-3.5 text-[12.5px] rounded-md cursor-pointer"
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
                                className="h-9 px-3.5 text-[12.5px] rounded-md cursor-pointer"
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
                                className="h-9 px-3.5 text-[12.5px] rounded-md cursor-pointer"
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
                            "h-9 w-9 inline-flex items-center justify-center rounded-md",
                            "border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30",
                            "transition-colors disabled:opacity-50 cursor-pointer",
                        )}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <ConfirmDialog {...dialogProps} />
        </article>
    );
}

function ApplicantsLink({
    listingId,
    applicants,
    unseen,
}: {
    listingId: string;
    applicants: number;
    unseen: number;
}) {
    return (
        <Link
            href={`/home/applicants?listingId=${listingId}`}
            className="inline-flex items-center gap-1.5 text-foreground hover:text-orange-600 transition-colors font-medium"
        >
            <PiUsers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
                {applicants} {applicants === 1 ? "applicant" : "applicants"}
            </span>
            {unseen > 0 && (
                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-md bg-orange-500 text-white text-[10px] font-semibold tabular-nums">
                    {unseen} new
                </span>
            )}
            <ChevronRight className="h-3 w-3" />
        </Link>
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

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
