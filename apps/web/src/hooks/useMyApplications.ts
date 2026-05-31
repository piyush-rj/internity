"use client";

import { useCallback, useEffect, useState } from "react";
import {
    applicationApi,
    type Application,
    type ListingWithCompany,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type ApplicationWithListing = Application & {
    listing: ListingWithCompany;
};

export type MyApplicationsState = {
    items: ApplicationWithListing[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
    withdraw: (id: string) => Promise<void>;
    restore: (id: string) => Promise<void>;
};

export function useMyApplications(
    options: { enabled?: boolean } = {},
): MyApplicationsState {
    const enabled = options.enabled ?? true;
    const [items, setItems] = useState<ApplicationWithListing[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchApplications = useCallback(async () => {
        if (!enabled) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { items } = await applicationApi.list_mine();
            setItems(items);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    // Withdrawing keeps the row (now WITHDRAWN) so it surfaces under
    // "Recently Deleted" and can be restored, rather than vanishing.
    const withdraw = useCallback(async (id: string) => {
        await applicationApi.withdraw(id);
        const at = new Date().toISOString();
        setItems((prev) =>
            prev.map((a) =>
                a.id === id
                    ? { ...a, status: "WITHDRAWN", statusUpdatedAt: at }
                    : a,
            ),
        );
    }, []);

    const restore = useCallback(async (id: string) => {
        const { application } = await applicationApi.restore(id);
        setItems((prev) =>
            prev.map((a) =>
                a.id === id
                    ? {
                          ...a,
                          status: application.status,
                          statusUpdatedAt: application.statusUpdatedAt,
                      }
                    : a,
            ),
        );
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchApplications();
    }, [fetchApplications]);

    return {
        items,
        loading,
        error,
        refetch: fetchApplications,
        withdraw,
        restore,
    };
}
