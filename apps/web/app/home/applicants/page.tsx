"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
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

    const { memberships } = useMyEmployer();
    const companyName = memberships[0]?.company.name ?? "";
    const companyId = memberships[0]?.company.id ?? undefined;
    // Applicants can be handled by any company member (HR/Member too), so
    // scope to the whole company rather than just listings I posted.
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

    // Seed the listing filter from the URL on first load so deep links
    // from the dashboard still scope to the right role. After that the
    // filter card owns the state and we keep the URL in sync.
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

    useEffect(() => {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (filters.listingId === "all") params.delete("listingId");
        else params.set("listingId", filters.listingId);
        const next = params.toString();
        const current = searchParams?.toString() ?? "";
        if (next === current) return;
        router.replace(next ? `/home/applicants?${next}` : "/home/applicants", {
            scroll: false,
        });
    }, [filters.listingId, router, searchParams]);

    // Screening questions + best-match sort default depend on whether a
    // single listing is selected.
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
                                                : visibleItems.length
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
                        ) : visibleItems.length === 0 ? (
                            <EmptyCard hasFilters={activeFilterCount > 0} />
                        ) : (
                            visibleItems.map((applicant) => (
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
                                    : visibleItems.length
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
            Couldn’t load applicants — {message}
        </div>
    );
}
