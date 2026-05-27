"use client";

import { ListingList } from "@/src/components/listings/ListingList";
import { useListings } from "@/src/hooks/useListings";

export function RecommendedInternships() {
    const { items, loading, error } = useListings({
        pageSize: 4,
    });

    return (
        <ListingList
            items={items}
            loading={loading}
            error={error}
            compact
            emptyText="No open internships right now. Check back tomorrow."
        />
    );
}
