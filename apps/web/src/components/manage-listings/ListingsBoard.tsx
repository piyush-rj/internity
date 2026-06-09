"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { MyListingCard } from "@/src/components/manage-listings/MyListingCard";
import {
    MyListingsFilterPanel,
    applyMyListingsFilters,
    emptyMyListingsFilters,
    type MyListingsFilters,
} from "@/src/components/manage-listings/MyListingsFilterPanel";
import { MyListingsFiltersMobile } from "@/src/components/manage-listings/MyListingsFiltersMobile";
import { useMyListings } from "@/src/hooks/useMyListings";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { cn } from "@/src/lib/utils";

// Shared listings manager used by both "My listings" (scope="mine" — only
// what the caller posted) and "Company's listings" (scope="company" — every
// listing under the active company). Same filters + lifecycle controls;
// only the data scope and the surrounding copy differ.
export function ListingsBoard({
    scope,
    companyId,
    title,
    description,
}: {
    scope: "mine" | "company";
    companyId?: string;
    title: string;
    description: string;
}) {
    const {
        items,
        loading,
        error,
        close,
        reopen,
        renew,
        pause,
        unpause,
        remove,
    } = useMyListings({ scope, companyId });

    const { memberships, refetch: refetchEmployer } = useMyEmployer();
    const company = memberships[0]?.company ?? null;

    // Always refetch employer data on mount so grants/revocations are reflected
    // without requiring a full page reload.
    useEffect(() => {
        refetchEmployer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const isPremium = company?.isPremium ?? false;
    // Directly from DB — now accurate because the gate always consumes free
    // slots first (even for premium companies) before using the paid plan.
    const freeListingUsed = company?.freeListingUsed ?? false;
    const remainingGranted = (company?.freePostingGrants ?? []).reduce(
        (sum, g) => sum + (g.grantedPostings - g.usedPostings),
        0,
    );
    const [filters, setFilters] = useState<MyListingsFilters>(
        emptyMyListingsFilters,
    );

    const filtered = useMemo(
        () => applyMyListingsFilters(items, filters),
        [items, filters],
    );
    const openCount = items.filter((it) => !it.closedAt).length;
    const hasActiveFilters =
        filters.q.trim().length > 0 ||
        filters.statuses.size > 0 ||
        filters.modes.size > 0 ||
        filters.jobTitles.size > 0 ||
        filters.customRoles.length > 0 ||
        filters.applicants !== "any";

    return (
        <EmptySection title={title} description={description}>
            {/* Subscription status banner */}
            {!isPremium && (
                <div
                    className={cn(
                        "rounded-lg border px-4 py-3 flex items-start gap-3",
                        freeListingUsed && remainingGranted === 0
                            ? "border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900"
                            : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900",
                    )}
                >
                    <Crown
                        className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            freeListingUsed && remainingGranted === 0
                                ? "text-rose-500"
                                : "text-amber-500",
                        )}
                    />
                    <div className="flex-1 min-w-0">
                        {freeListingUsed && remainingGranted === 0 ? (
                            <>
                                <p className="text-[13px] font-medium text-rose-800 dark:text-rose-300">
                                    Free listing used
                                </p>
                                <p className="mt-0.5 text-[12px] text-rose-700/80 dark:text-rose-400/80">
                                    Your company has used its one free listing.
                                    Subscribe to a plan to post more.
                                </p>
                            </>
                        ) : freeListingUsed && remainingGranted > 0 ? (
                            <>
                                <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">
                                    {remainingGranted} free listing
                                    {remainingGranted !== 1 ? "s" : ""}{" "}
                                    available
                                </p>
                                <p className="mt-0.5 text-[12px] text-amber-700/80 dark:text-amber-400/80">
                                    Your company has been granted{" "}
                                    {remainingGranted} free listing
                                    {remainingGranted !== 1 ? "s" : ""} to use.
                                    Subscribe for unlimited posts.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">
                                    {1 + remainingGranted} free listing
                                    {1 + remainingGranted !== 1 ? "s" : ""}{" "}
                                    available
                                </p>
                                <p className="mt-0.5 text-[12px] text-amber-700/80 dark:text-amber-400/80">
                                    Your company gets one free listing to start.
                                    Subscribe for unlimited posts.
                                </p>
                            </>
                        )}
                        <Link
                            href="/home/explore-plans"
                            className={cn(
                                "mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium hover:underline",
                                freeListingUsed && remainingGranted === 0
                                    ? "text-rose-700 dark:text-rose-300"
                                    : "text-amber-700 dark:text-amber-300",
                            )}
                        >
                            View plans →
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-3">
                    <MyListingsFiltersMobile
                        filters={filters}
                        onChange={setFilters}
                    />
                    <header className="flex items-center justify-between gap-3 px-1">
                        <div className="text-[13px] font-medium">
                            All listings
                        </div>
                        {!loading && items.length > 0 && (
                            <span className="text-[11.5px] text-muted-foreground tabular-nums">
                                {hasActiveFilters
                                    ? `${filtered.length} of ${items.length}`
                                    : `${openCount} open · ${items.length} total`}
                            </span>
                        )}
                    </header>

                    {error ? (
                        <ErrorRow message={error.message} />
                    ) : loading ? (
                        <Skeleton />
                    ) : items.length === 0 ? (
                        <Empty />
                    ) : filtered.length === 0 ? (
                        <NoMatches />
                    ) : (
                        <ul className="space-y-3">
                            {filtered.map((listing) => (
                                <li key={listing.id}>
                                    <MyListingCard
                                        listing={listing}
                                        onClose={close}
                                        onReopen={reopen}
                                        onRenew={renew}
                                        onPause={pause}
                                        onUnpause={unpause}
                                        onRemove={remove}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                    <MyListingsFilterPanel
                        filters={filters}
                        onChange={setFilters}
                    />
                </aside>
            </div>
        </EmptySection>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
                >
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="flex gap-1.5">
                        <div className="h-5 w-16 rounded bg-muted" />
                        <div className="h-5 w-14 rounded bg-muted" />
                        <div className="h-5 w-12 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Empty() {
    return (
        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-5 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
                You haven’t posted anything yet.
            </p>
            <Link
                href="/home/manage-listings/new"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                <Plus className="h-3 w-3" />
                Post your first listing
            </Link>
        </div>
    );
}

function NoMatches() {
    return (
        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-5 py-12 text-center text-[13px] text-muted-foreground">
            No listings match these filters.
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div
            className={cn(
                "rounded-lg border border-destructive/30 bg-destructive/5",
                "px-3 py-2.5 text-[12.5px] text-destructive",
            )}
        >
            Couldn’t load listings — {message}
        </div>
    );
}
