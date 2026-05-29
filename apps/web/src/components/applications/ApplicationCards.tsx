"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
    PiBriefcase,
    PiCalendar,
    PiClock,
    PiCurrencyInr,
    PiMapPin,
} from "react-icons/pi";
import {
    SeenBadge,
    StatusBadge,
    type ApplicationCardItem,
} from "@/src/components/applications/ApplicationCard";
import { VerifiedBadge } from "@/src/components/listings/VerifiedBadge";
import { ApiClientError } from "@/src/lib/apiClient";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { cn } from "@/src/lib/utils";

export function ApplicationCards({
    items,
    loading,
    error,
    emptyText = "You haven’t applied anywhere yet.",
    onWithdraw,
}: {
    items: ApplicationCardItem[];
    loading: boolean;
    error: ApiClientError | Error | null;
    emptyText?: string;
    onWithdraw?: (id: string) => void;
}) {
    if (error) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12.5px] text-destructive">
                Couldn’t load applications — {error.message}
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
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center text-[13px] text-muted-foreground">
                {emptyText}
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {items.map((app) => (
                <ApplicationItemCard
                    key={app.id}
                    application={app}
                    onWithdraw={onWithdraw}
                />
            ))}
        </div>
    );
}

function ApplicationItemCard({
    application,
    onWithdraw,
}: {
    application: ApplicationCardItem;
    onWithdraw?: (id: string) => void;
}) {
    const { listing, status, appliedAt, seenAt } = application;
    const canWithdraw =
        !!onWithdraw &&
        status !== "WITHDRAWN" &&
        status !== "REJECTED" &&
        status !== "HIRED";
    const stipend = formatStipend(listing.stipendMin, listing.stipendMax);
    const location =
        listing.mode === "REMOTE" ? "Work from home" : listing.city;
    return (
        <article className="group relative rounded-lg border border-border bg-card px-4 py-4 sm:px-5 hover:border-foreground/20 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <Link
                                href={`/home/listings/${listing.id}`}
                                className="block"
                            >
                                <h3 className="text-[15px] font-semibold text-foreground group-hover:text-orange-600 transition-colors truncate">
                                    {formatListingTitle(listing.title)}
                                </h3>
                            </Link>
                            <div className="mt-1 flex items-center gap-2 flex-wrap text-[12.5px] text-muted-foreground">
                                <span className="font-medium text-foreground/90 truncate">
                                    {listing.company.name}
                                </span>
                                {listing.company.verificationStatus ===
                                    "APPROVED" && <VerifiedBadge />}
                                <StatusBadge status={status} />
                                <SeenBadge status={status} seenAt={seenAt} />
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
                        {listing.durationMonths && (
                            <li className="inline-flex items-center gap-1.5 tabular-nums">
                                <PiClock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {listing.durationMonths} month
                                    {listing.durationMonths === 1 ? "" : "s"}
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

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                            <PiCalendar className="h-3.5 w-3.5" />
                            Applied {formatDate(appliedAt)}
                        </span>
                        {canWithdraw && (
                            <button
                                type="button"
                                onClick={() => onWithdraw!(application.id)}
                                aria-label="Withdraw application"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-lg shrink-0",
                                    "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                    "transition-colors",
                                )}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
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

function CardSkeleton() {
    return (
        <div className="rounded-lg border border-border bg-card px-5 py-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="flex gap-1.5 pt-1">
                        <div className="h-5 w-16 rounded bg-muted" />
                        <div className="h-5 w-14 rounded bg-muted" />
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

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
