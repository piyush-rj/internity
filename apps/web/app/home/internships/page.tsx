"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingCards } from "@/src/components/listings/ListingCards";
import { ListingsFiltersMobile } from "@/src/components/listings/ListingsFiltersMobile";
import { ListingsFiltersPanel } from "@/src/components/listings/ListingsFiltersPanel";
import { MultiApplyBar } from "@/src/components/listings/MultiApplyBar";
import { PaginationBar } from "@/src/components/listings/PaginationBar";
import {
    filtersFromSearchParams,
    PAGE_SIZE,
} from "@/src/components/listings/filtersFromSearchParams";
import { useListings } from "@/src/hooks/useListings";
import { useAppliedStore } from "@/src/store/useAppliedStore";

export default function InternshipsPage() {
    return (
        <Suspense fallback={null}>
            <InternshipsView />
        </Suspense>
    );
}

function InternshipsView() {
    const sp = useSearchParams();
    const filters = filtersFromSearchParams(sp);
    const { items, total, page, pageSize, loading, error } =
        useListings(filters);

    // Applied/Not-applied is a client-side post-filter because the server
    // doesn't know who applied to what for browse queries.
    const appliedMode = sp?.get("applied") ?? "";
    const appliedIds = useAppliedStore((s) => s.appliedIds);
    const visibleItems = useMemo(() => {
        if (appliedMode === "applied") {
            return items.filter((l) => appliedIds[l.id]);
        }
        if (appliedMode === "not_applied") {
            return items.filter((l) => !appliedIds[l.id]);
        }
        return items;
    }, [items, appliedMode, appliedIds]);

    return (
        <EmptySection
            title="Internships"
            description="Browse open internships across India."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-5">
                    <ListingsFiltersMobile basePath="/home/internships" />
                    <ListingCards
                        items={visibleItems}
                        loading={loading}
                        error={error}
                        emptyText="No internships match these filters. Try widening your search."
                    />
                    <PaginationBar
                        basePath="/home/internships"
                        page={page}
                        pageSize={pageSize ?? PAGE_SIZE}
                        total={total}
                    />
                </div>
                <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                    <ListingsFiltersPanel basePath="/home/internships" />
                </aside>
            </div>
            <MultiApplyBar />
        </EmptySection>
    );
}
