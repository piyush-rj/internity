"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { ListingList } from "@/src/components/listings/ListingList";
import { ListingsFilters } from "@/src/components/listings/ListingsFilters";
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
            <ListingsFilters basePath="/home/jobs" />

            <ListHeader title="All jobs" count={total} loading={loading} />

            <div className="mt-5">
                <ListingList
                    items={items}
                    loading={loading}
                    error={error}
                    emptyText="No jobs match these filters. Try widening your search."
                />
            </div>

            <PaginationBar
                basePath="/home/jobs"
                page={page}
                pageSize={pageSize ?? PAGE_SIZE}
                total={total}
            />

            <MultiApplyBar />
        </EmptySection>
    );
}
