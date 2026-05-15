"use client";

import { useCallback, useEffect, useState } from "react";
import {
    applicationApi,
    listingApi,
    type ApplicantWithStudent,
    type ApplicationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

type DecidedStatus = Exclude<ApplicationStatus, "WITHDRAWN">;

export type ListingApplicantsState = {
    items: ApplicantWithStudent[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
    updateStatus: (
        applicationId: string,
        status: DecidedStatus,
    ) => Promise<void>;
};

export function useListingApplicants(
    listingId: string | null,
): ListingApplicantsState {
    const [items, setItems] = useState<ApplicantWithStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchApplicants = useCallback(async () => {
        if (!listingId) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { items } = await listingApi.list_applicants(listingId);
            setItems(items);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [listingId]);

    const updateStatus = useCallback(
        async (applicationId: string, status: DecidedStatus) => {
            const { application } = await applicationApi.update_status(
                applicationId,
                status,
            );
            setItems((prev) =>
                prev.map((it) =>
                    it.id === applicationId
                        ? {
                              ...it,
                              status: application.status,
                              statusUpdatedAt: application.statusUpdatedAt,
                          }
                        : it,
                ),
            );
        },
        [],
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchApplicants();
    }, [fetchApplicants]);

    return {
        items,
        loading,
        error,
        refetch: fetchApplicants,
        updateStatus,
    };
}
