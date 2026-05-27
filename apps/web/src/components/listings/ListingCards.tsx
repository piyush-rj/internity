"use client";

import { useState } from "react";
import Link from "next/link";
import {
    PiBookmarkSimple,
    PiBookmarkSimpleFill,
    PiBriefcase,
    PiCheckCircleFill,
    PiClock,
    PiCurrencyInr,
    PiLightning,
    PiMapPin,
} from "react-icons/pi";
import type { ListingWithCompany } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useIsApplied } from "@/src/store/useAppliedStore";
import { useMe } from "@/src/hooks/useMe";
import { useMultiSelectStore } from "@/src/store/useMultiSelectStore";
import { formatDuration } from "@/src/lib/format/duration";
import { useIsSaved, useSavedStore } from "@/src/store/useSavedStore";
import { VerifiedBadge } from "@/src/components/listings/VerifiedBadge";
import { cn } from "@/src/lib/utils";

export function ListingCards({
    items,
    loading,
    error,
    emptyText = "No listings yet — check back soon.",
}: {
    items: ListingWithCompany[];
    loading: boolean;
    error: ApiClientError | Error | null;
    emptyText?: string;
}) {
    if (error) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12.5px] text-destructive">
                Couldn’t load listings — {error.message}
            </div>
        );
    }
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-100 px-6 py-12 text-center text-[13px] text-muted-foreground">
                {emptyText}
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
            ))}
        </div>
    );
}

function ListingCard({ listing }: { listing: ListingWithCompany }) {
    const applied = useIsApplied(listing.id);
    const { me } = useMe();
    const canMultiApply = me?.role === "STUDENT" && !applied;
    const [now] = useState(() => Date.now());
    const isFresh =
        now - new Date(listing.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    const closed = !!listing.closedAt;
    const stipend = formatStipend(listing.stipendMin, listing.stipendMax);
    const location =
        listing.mode === "REMOTE" ? "Work from home" : listing.city;
    return (
        <article
            className={cn(
                "group relative rounded-lg border border-border bg-card px-4 py-4 sm:px-5",
                "hover:border-foreground/20 hover:shadow-sm transition-all",
            )}
        >
            <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex flex-col items-center gap-1.5 pt-1 shrink-0">
                    {canMultiApply && <RowCheckbox listing={listing} />}
                    <SaveButton listing={listing} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-foreground truncate">
                                {listing.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 flex-wrap text-[12.5px] text-muted-foreground">
                                <span className="font-medium text-foreground/90 truncate">
                                    {listing.company.name}
                                </span>
                                {listing.company.verificationStatus ===
                                    "APPROVED" && <VerifiedBadge />}
                                {applied ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10.5px] font-semibold">
                                        <PiCheckCircleFill className="h-3 w-3" />
                                        Applied
                                    </span>
                                ) : !closed ? (
                                    <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-medium">
                                        Actively hiring
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <CompanyAvatar
                            name={listing.company.name}
                            logoUrl={listing.company.logoUrl}
                        />
                    </div>

                    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-foreground/80">
                        {location && (
                            <li className="inline-flex items-center gap-1.5">
                                <PiMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate max-w-50">
                                    {location}
                                </span>
                            </li>
                        )}
                        {stipend && (
                            <li className="inline-flex items-center gap-1.5 tabular-nums">
                                <PiCurrencyInr className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{stipend} /mo</span>
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
                        {listing.partTime && (
                            <li className="inline-flex items-center gap-1.5">
                                <PiBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Part-time</span>
                            </li>
                        )}
                    </ul>

                    {listing.description && (
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
                            {listing.description}
                        </p>
                    )}

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

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
                            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 font-medium">
                                <PiClock className="h-3 w-3" />
                                {timeAgo(listing.createdAt)}
                            </span>
                            {isFresh && !closed && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-medium">
                                    <PiLightning className="h-3 w-3" />
                                    Be an early applicant
                                </span>
                            )}
                        </div>
                        <div className="self-stretch sm:self-auto">
                            <ApplyCta
                                listing={listing}
                                applied={applied}
                                closed={closed}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function ApplyCta({
    listing,
    applied,
    closed,
}: {
    listing: ListingWithCompany;
    applied: boolean;
    closed: boolean;
}) {
    if (closed) {
        return (
            <span className="inline-flex w-full sm:w-auto items-center justify-center h-9 px-4 rounded-md text-[12.5px] font-medium border border-border bg-secondary text-muted-foreground">
                Closed
            </span>
        );
    }
    if (applied) {
        return (
            <Link
                href={`/home/listings/${listing.id}`}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 h-9 px-4 rounded-md text-[12.5px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
                <PiCheckCircleFill className="h-3.5 w-3.5" />
                View application
            </Link>
        );
    }
    return (
        <Link
            href={`/home/listings/${listing.id}`}
            className="inline-flex w-full sm:w-auto items-center justify-center h-9 px-4 rounded-md text-[12.5px] font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/20 transition-colors transform duration-250"
        >
            Apply now
        </Link>
    );
}

function CompanyAvatar({
    name,
    logoUrl,
}: {
    name: string;
    logoUrl: string | null;
}) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-12 w-12 rounded-lg object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[15px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function SaveButton({ listing }: { listing: ListingWithCompany }) {
    const saved = useIsSaved(listing.id);
    const toggle = useSavedStore((s) => s.toggle);

    function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        toggle(listing);
    }

    const Icon = saved ? PiBookmarkSimpleFill : PiBookmarkSimple;
    return (
        <button
            type="button"
            aria-label={saved ? "Unsave" : "Save"}
            aria-pressed={saved}
            onClick={handleClick}
            className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors shrink-0",
                saved
                    ? "text-brand hover:bg-brand/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function RowCheckbox({ listing }: { listing: ListingWithCompany }) {
    const checked = useMultiSelectStore((s) => s.selected.has(listing.id));
    const toggle = useMultiSelectStore((s) => s.toggle);
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={() => toggle(listing)}
            onClick={(e) => e.stopPropagation()}
            aria-label={
                checked
                    ? `Unselect ${listing.title}`
                    : `Select ${listing.title} for bulk apply`
            }
            title="Add to bulk apply"
            className="h-4 w-4 rounded border-border accent-orange-500 cursor-pointer"
        />
    );
}

function CardSkeleton() {
    return (
        <div className="rounded-lg border border-border bg-card px-5 py-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="flex gap-1.5 pt-1">
                        <div className="h-5 w-14 rounded bg-muted" />
                        <div className="h-5 w-16 rounded bg-muted" />
                        <div className="h-5 w-12 rounded bg-muted" />
                    </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />
            </div>
        </div>
    );
}

function formatStipend(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    if (min && max && min !== max)
        return `₹${formatNum(min)}–${formatNum(max)}`;
    const v = max ?? min;
    return v ? `₹${formatNum(v)}` : null;
}

function formatNum(n: number): string {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return String(n);
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
