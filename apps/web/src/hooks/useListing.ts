"use client";

import { useCallback, useEffect, useState } from "react";
import { listingApi, type ListingWithCompany } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type ListingDetail = ListingWithCompany & { skills: unknown[] };

export type ListingState = {
    listing: ListingDetail | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

export function useListing(id: string): ListingState {
    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchListing = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { listing } = await listingApi.get(id);
            setListing(listing);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchListing();
    }, [fetchListing]);

    return { listing, loading, error, refetch: fetchListing };
}
