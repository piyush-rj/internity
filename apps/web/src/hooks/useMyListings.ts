"use client";

import { useCallback, useEffect, useState } from "react";
import { listingApi, type Listing } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type MyListing = Listing & { _count: { applications: number } };

export type MyListingsState = {
    items: MyListing[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
    close: (id: string) => Promise<void>;
    reopen: (id: string) => Promise<void>;
    renew: (id: string) => Promise<void>;
    pause: (id: string) => Promise<void>;
    unpause: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
};

export function useMyListings(): MyListingsState {
    const [items, setItems] = useState<MyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { items } = await listingApi.list_mine();
            setItems(items);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, []);

    const close = useCallback(async (id: string) => {
        const { listing } = await listingApi.close(id);
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, closedAt: listing.closedAt } : it,
            ),
        );
    }, []);

    const reopen = useCallback(async (id: string) => {
        const { listing } = await listingApi.reopen(id);
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, closedAt: listing.closedAt } : it,
            ),
        );
    }, []);

    const renew = useCallback(async (id: string) => {
        const { listing } = await listingApi.renew(id);
        setItems((prev) =>
            prev.map((it) =>
                it.id === id
                    ? {
                          ...it,
                          expiresAt: listing.expiresAt,
                          closedAt: listing.closedAt,
                      }
                    : it,
            ),
        );
    }, []);

    const pause = useCallback(async (id: string) => {
        const { listing } = await listingApi.pause(id);
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, pausedAt: listing.pausedAt } : it,
            ),
        );
    }, []);

    const unpause = useCallback(async (id: string) => {
        const { listing } = await listingApi.unpause(id);
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, pausedAt: listing.pausedAt } : it,
            ),
        );
    }, []);

    const remove = useCallback(async (id: string) => {
        await listingApi.remove(id);
        setItems((prev) => prev.filter((it) => it.id !== id));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchListings();
    }, [fetchListings]);

    return {
        items,
        loading,
        error,
        refetch: fetchListings,
        close,
        reopen,
        renew,
        pause,
        unpause,
        remove,
    };
}
