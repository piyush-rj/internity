"use client";

import { useCallback, useEffect, useState } from "react";
import {
    listingApi,
    type ListingListFilters,
    type ListingWithCompany,
    type Paginated,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type ListingsState = {
    items: ListingWithCompany[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

/**
 * Hook around GET /listing — accepts the same filter shape the backend takes
 * (type / q / city / mode / skills / stipendMin / durationMax / partTime / page / pageSize).
 * Re-fetches whenever the filter changes.
 */
export function useListings(filters?: ListingListFilters): ListingsState {
    const [page, setPage] = useState<Paginated<ListingWithCompany> | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    // Serialize filters so the effect only re-runs when meaningful inputs change.
    const filterKey = JSON.stringify(filters ?? {});

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listingApi.list(filters);
            setPage(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchListings();
    }, [fetchListings]);

    return {
        items: page?.items ?? [],
        total: page?.total ?? 0,
        page: page?.page ?? 1,
        pageSize: page?.pageSize ?? 20,
        loading,
        error,
        refetch: fetchListings,
    };
}
