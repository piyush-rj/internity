"use client";

import { useSearchParams } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { ListingList } from "@/src/components/listings/ListingList";
import { ListingsFilters } from "@/src/components/listings/ListingsFilters";
import { PaginationBar } from "@/src/components/listings/PaginationBar";
import {
    filtersFromSearchParams,
    PAGE_SIZE,
} from "@/src/components/listings/filtersFromSearchParams";
import { useListings } from "@/src/hooks/useListings";

export default function InternshipsPage() {
    const sp = useSearchParams();
    const filters = filtersFromSearchParams(sp, { type: "INTERNSHIP" });
    const { items, total, page, pageSize, loading, error } =
        useListings(filters);

    return (
        <EmptySection
            title="Internships"
            description="Browse open internships across India."
        >
            <ListingsFilters basePath="/home/internships" />

            <ListHeader
                title="All internships"
                count={total}
                loading={loading}
            />

            <div className="mt-5">
                <ListingList
                    items={items}
                    loading={loading}
                    error={error}
                    emptyText="No internships match these filters. Try widening your search."
                />
            </div>

            <PaginationBar
                basePath="/home/internships"
                page={page}
                pageSize={pageSize ?? PAGE_SIZE}
                total={total}
            />
        </EmptySection>
    );
}
