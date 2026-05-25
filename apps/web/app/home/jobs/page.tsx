"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { ListingCards } from "@/src/components/listings/ListingCards";
import { ListingsFiltersPanel } from "@/src/components/listings/ListingsFiltersPanel";
import { MultiApplyBar } from "@/src/components/listings/MultiApplyBar";
import { PaginationBar } from "@/src/components/listings/PaginationBar";
import {
    filtersFromSearchParams,
    PAGE_SIZE,
} from "@/src/components/listings/filtersFromSearchParams";
import { useListings } from "@/src/hooks/useListings";

export default function JobsPage() {
    return (
        <Suspense fallback={null}>
            <JobsView />
        </Suspense>
    );
}

function JobsView() {
    const sp = useSearchParams();
    const filters = filtersFromSearchParams(sp, { type: "JOB" });
    const { items, total, page, pageSize, loading, error } =
        useListings(filters);

    return (
        <EmptySection
            title="Jobs"
            description="Entry-level and fresher-friendly full-time roles."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-5">
                    <ListHeader
                        title="All jobs"
                        count={total}
                        loading={loading}
                    />
                    <ListingCards
                        items={items}
                        loading={loading}
                        error={error}
                        emptyText="No jobs match these filters. Try widening your search."
                    />
                    <PaginationBar
                        basePath="/home/jobs"
                        page={page}
                        pageSize={pageSize ?? PAGE_SIZE}
                        total={total}
                    />
                </div>
                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <ListingsFiltersPanel basePath="/home/jobs" />
                </aside>
            </div>

            <MultiApplyBar />
        </EmptySection>
    );
}
