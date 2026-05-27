"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ApplicantCard } from "@/src/components/applicants/ApplicantCard";
import {
    ApplicantsFilterPanel,
    applyApplicantsFilters,
    countActiveApplicantFilters,
    emptyApplicantsFilters,
    type ApplicantsFilters,
} from "@/src/components/applicants/ApplicantsFilterPanel";
import { useListingApplicants } from "@/src/hooks/useListingApplicants";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMyListings } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

export default function ApplicantsPage() {
    return (
        <Suspense fallback={<SectionSkeleton />}>
            <ApplicantsView />
        </Suspense>
    );
}

function ApplicantsView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queriedId = searchParams?.get("listingId") ?? null;

    const { items: listings, loading: listingsLoading } = useMyListings();
    const { memberships } = useMyEmployer();
    const companyName = memberships[0]?.company.name ?? "";

    // resolve which listing's applicants to show, preferring the url param
    const activeListingId = useMemo(() => {
        if (listings.length === 0) return null;
        if (queriedId && listings.some((l) => l.id === queriedId))
            return queriedId;
        return listings[0]?.id ?? null;
    }, [listings, queriedId]);

    // keep the url in sync with the resolved choice
    useEffect(() => {
        if (!activeListingId) return;
        if (queriedId === activeListingId) return;
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set("listingId", activeListingId);
        router.replace(`/home/applicants?${params.toString()}`);
    }, [activeListingId, queriedId, router, searchParams]);

    const {
        items,
        screeningQuestions,
        skillTagsRaw,
        loading,
        error,
        updateStatus,
    } = useListingApplicants(activeListingId);

    // Filters live in state and start fresh when the active listing changes
    // (different screening questions, different default sort).
    const [filters, setFilters] = useState<ApplicantsFilters>(() =>
        emptyApplicantsFilters(),
    );
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFilters({
            ...emptyApplicantsFilters(),
            sort: skillTagsRaw.length > 0 ? "match_desc" : "applied_desc",
        });
    }, [activeListingId, skillTagsRaw.length]);

    const visibleItems = useMemo(
        () => applyApplicantsFilters(items, filters, skillTagsRaw),
        [items, filters, skillTagsRaw],
    );

    const activeListingTitle = useMemo(
        () => listings.find((l) => l.id === activeListingId)?.title ?? "",
        [listings, activeListingId],
    );

    const activeFilterCount = countActiveApplicantFilters(filters);

    return (
        <EmptySection
            title="Applicants"
            description="Everyone who applied to your open roles."
        >
            {listingsLoading ? (
                <SectionSkeleton />
            ) : listings.length === 0 ? (
                <NoListings />
            ) : (
                <>
                    <ListingPicker
                        listings={listings}
                        activeId={activeListingId}
                        onChange={(id) =>
                            router.replace(`/home/applicants?listingId=${id}`)
                        }
                    />
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                        <section className="rounded-lg border border-border bg-card overflow-hidden min-w-0">
                            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="text-[13px] font-medium">
                                        Applicants
                                    </div>
                                    {!loading && !error && (
                                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                                            {visibleItems.length} of{" "}
                                            {items.length}
                                        </span>
                                    )}
                                    {activeFilterCount > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] text-orange-700">
                                            {activeFilterCount}{" "}
                                            {activeFilterCount === 1
                                                ? "filter"
                                                : "filters"}{" "}
                                            active
                                        </span>
                                    )}
                                </div>
                            </header>

                            {error ? (
                                <ErrorRow message={error.message} />
                            ) : loading ? (
                                <Skeleton />
                            ) : visibleItems.length === 0 ? (
                                <Empty hasFilters={activeFilterCount > 0} />
                            ) : (
                                <ul className="divide-y divide-border">
                                    {visibleItems.map((applicant) => (
                                        <li key={applicant.id}>
                                            <ApplicantCard
                                                applicant={applicant}
                                                screeningQuestions={
                                                    screeningQuestions
                                                }
                                                listingSkillTags={skillTagsRaw}
                                                listingTitle={
                                                    activeListingTitle
                                                }
                                                companyName={companyName}
                                                onUpdateStatus={updateStatus}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                            <ApplicantsFilterPanel
                                filters={filters}
                                onChange={setFilters}
                                screeningQuestions={screeningQuestions}
                            />
                        </aside>
                    </div>
                </>
            )}
        </EmptySection>
    );
}

function ListingPicker({
    listings,
    activeId,
    onChange,
}: {
    listings: ReturnType<typeof useMyListings>["items"];
    activeId: string | null;
    onChange: (id: string) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label
                htmlFor="listing-picker"
                className="text-[12.5px] font-medium text-muted-foreground"
            >
                Listing
            </label>
            <select
                id="listing-picker"
                value={activeId ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "h-9 w-full sm:w-auto rounded-md border border-border bg-background px-2 pr-8",
                    "text-[13px] appearance-none",
                    "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                )}
            >
                {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                        {l.title} {l.closedAt ? "(closed)" : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Skeleton() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-start gap-4 px-5 py-4 animate-pulse"
                >
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function SectionSkeleton() {
    return (
        <div className="space-y-3">
            <div className="h-9 w-64 rounded-md bg-secondary animate-pulse" />
            <div className="h-40 w-full rounded-lg bg-secondary/40 animate-pulse" />
        </div>
    );
}

function Empty({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            {hasFilters
                ? "No applicants match these filters."
                : "No applicants yet for this listing."}
        </div>
    );
}

function NoListings() {
    return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium">No listings to show.</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
                Post your first role to start collecting applicants.
            </p>
            <Link
                href="/home/manage-listings/new"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                <Plus className="h-3 w-3" />
                Post a listing
            </Link>
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn’t load applicants — {message}
        </div>
    );
}
