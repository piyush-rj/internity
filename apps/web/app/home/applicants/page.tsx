"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown, Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { FilterDrawer } from "@/src/components/base/FilterDrawer";
import { ApplicantCard } from "@/src/components/applicants/ApplicantCard";
import {
    ApplicantsFilterPanel,
    applyApplicantsFilters,
    countActiveApplicantFilters,
    emptyApplicantsFilters,
    type ApplicantsFilters,
} from "@/src/components/applicants/ApplicantsFilterPanel";
import {
    useCompanyApplicants,
    type AggregatedApplicant,
} from "@/src/hooks/useCompanyApplicants";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { useMyListings } from "@/src/hooks/useMyListings";
import { useMe } from "@/src/hooks/useMe";
import { PaginationBar } from "@/src/components/listings/PaginationBar";

const PAGE_SIZE = 10;
const FREE_LIMIT = 100;

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
    const page = Math.max(1, parseInt(searchParams?.get("page") ?? "1", 10));

    const { me } = useMe();
    const { memberships } = useMyEmployer();
    const companyName = memberships[0]?.company.name ?? "";
    const companyId = memberships[0]?.company.id ?? undefined;
    const { items: listings, loading: listingsLoading } = useMyListings({
        scope: "company",
        companyId,
    });

    const listingOptions = useMemo(
        () => listings.map((l) => ({ id: l.id, title: l.title })),
        [listings],
    );

    const { items, loading, error, updateStatus } =
        useCompanyApplicants(listingOptions);

    const [filters, setFilters] = useState<ApplicantsFilters>(() =>
        emptyApplicantsFilters(),
    );

    useEffect(() => {
        if (listings.length === 0) return;
        if (
            queriedId &&
            queriedId !== filters.listingId &&
            listings.some((l) => l.id === queriedId)
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFilters((f) => ({
                ...f,
                listingId: queriedId,
                screening: {},
            }));
        }
    }, [queriedId, listings, filters.listingId]);

    // Track previous listingId so we only reset page when it actually changes,
    // not on every searchParams update (e.g. page navigation).
    const prevListingId = useRef(filters.listingId);
    useEffect(() => {
        const listingChanged = prevListingId.current !== filters.listingId;
        prevListingId.current = filters.listingId;

        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (filters.listingId === "all") params.delete("listingId");
        else params.set("listingId", filters.listingId);
        if (listingChanged) params.delete("page");
        const next = params.toString();
        const current = searchParams?.toString() ?? "";
        if (next === current) return;
        router.replace(next ? `/home/applicants?${next}` : "/home/applicants", {
            scroll: false,
        });
    }, [filters.listingId, router, searchParams]);

    const activeListing = useMemo(
        () =>
            filters.listingId === "all"
                ? null
                : (listings.find((l) => l.id === filters.listingId) ?? null),
        [listings, filters.listingId],
    );
    const screeningQuestions = useMemo(() => {
        if (!activeListing) return [];
        const sample = items.find((a) => a.listing.id === activeListing.id);
        return sample?.listing.screeningQuestions ?? [];
    }, [items, activeListing]);

    const getListingSkills = (a: AggregatedApplicant) => a.listing.skillTagsRaw;
    const getListingId = (a: AggregatedApplicant) => a.listing.id;

    const visibleItems = useMemo(
        () =>
            applyApplicantsFilters(
                items,
                filters,
                getListingSkills,
                getListingId,
            ),
        [items, filters],
    );

    // Listings posted while the employer had an active premium subscription are
    // grandfathered — all their applicants stay visible even after premium lapses.
    // grantedListingIds = null means the employer is currently premium (no cap at all).
    const isPremium = me?.isPremium ?? false;
    const premiumUntil = me?.premiumUntil ?? null;

    const grantedListingIds = useMemo(() => {
        if (isPremium) return null;
        if (!premiumUntil) return new Set<string>();
        const expiry = new Date(premiumUntil);
        return new Set(
            listings
                .filter((l) => new Date(l.createdAt) <= expiry)
                .map((l) => l.id),
        );
    }, [isPremium, premiumUntil, listings]);

    // Apply the FREE_LIMIT cap while preserving list order. Applicants from
    // grandfathered listings are always shown; non-grandfathered ones are
    // capped at FREE_LIMIT total across all non-granted listings.
    const { cappedItems, isCapActive } = useMemo(() => {
        if (!grantedListingIds) {
            return { cappedItems: visibleItems, isCapActive: false };
        }
        let nonGrantedCount = 0;
        const result: AggregatedApplicant[] = [];
        for (const item of visibleItems) {
            if (grantedListingIds.has(item.listing.id)) {
                result.push(item);
            } else if (nonGrantedCount < FREE_LIMIT) {
                result.push(item);
                nonGrantedCount++;
            }
        }
        return {
            cappedItems: result,
            isCapActive: result.length < visibleItems.length,
        };
    }, [visibleItems, grantedListingIds]);

    const pageItems = useMemo(
        () => cappedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [cappedItems, page],
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
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                    <div className="min-w-0 space-y-3">
                        <div className="lg:hidden">
                            <FilterDrawer activeCount={activeFilterCount}>
                                {(close) => (
                                    <ApplicantsFilterPanel
                                        filters={filters}
                                        onChange={setFilters}
                                        onApplied={close}
                                        screeningQuestions={screeningQuestions}
                                        listings={listingOptions}
                                        visibleCount={
                                            loading || error
                                                ? undefined
                                                : cappedItems.length
                                        }
                                        totalCount={
                                            loading || error
                                                ? undefined
                                                : items.length
                                        }
                                    />
                                )}
                            </FilterDrawer>
                        </div>
                        {error ? (
                            <ErrorRow message={error.message} />
                        ) : loading ? (
                            <Skeleton />
                        ) : cappedItems.length === 0 ? (
                            <EmptyCard hasFilters={activeFilterCount > 0} />
                        ) : (
                            pageItems.map((applicant) => (
                                <div
                                    key={applicant.id}
                                    className="rounded-lg border border-border bg-card overflow-hidden"
                                >
                                    <ApplicantCard
                                        applicant={applicant}
                                        screeningQuestions={
                                            applicant.listing.screeningQuestions
                                        }
                                        listingSkillTags={
                                            applicant.listing.skillTagsRaw
                                        }
                                        listingTitle={formatListingTitle(
                                            applicant.listing.title,
                                        )}
                                        companyName={companyName}
                                        onUpdateStatus={updateStatus}
                                    />
                                </div>
                            ))
                        )}
                        <PaginationBar
                            basePath="/home/applicants"
                            page={page}
                            pageSize={PAGE_SIZE}
                            total={cappedItems.length}
                        />
                        {isCapActive && (
                            <FreeLimitBanner
                                hidden={
                                    visibleItems.length - cappedItems.length
                                }
                            />
                        )}
                    </div>

                    <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                        <ApplicantsFilterPanel
                            filters={filters}
                            onChange={setFilters}
                            screeningQuestions={screeningQuestions}
                            listings={listingOptions}
                            visibleCount={
                                loading || error
                                    ? undefined
                                    : cappedItems.length
                            }
                            totalCount={
                                loading || error ? undefined : items.length
                            }
                        />
                    </aside>
                </div>
            )}
        </EmptySection>
    );
}

function FreeLimitBanner({ hidden }: { hidden: number }) {
    return (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 px-5 py-4 flex items-start gap-3">
            <Crown className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-orange-800 dark:text-orange-300">
                    {hidden} more applicant{hidden !== 1 ? "s" : ""} hidden
                </p>
                <p className="mt-0.5 text-[12px] text-orange-700/80 dark:text-orange-400/80">
                    Free accounts can view up to {FREE_LIMIT} applicants.
                    Upgrade to see everyone who applied.
                </p>
                <Link
                    href="/home/explore-plans"
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-orange-700 dark:text-orange-300 hover:underline"
                >
                    View plans →
                </Link>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-border bg-card flex items-start gap-4 px-5 py-4 animate-pulse"
                >
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                </div>
            ))}
        </>
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

function EmptyCard({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="rounded-lg border border-border bg-card px-5 py-12 text-center text-[13px] text-muted-foreground">
            {hasFilters
                ? "No applicants match these filters."
                : "No applicants yet."}
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn&apos;t load applicants — {message}
        </div>
    );
}
