"use client";

import { useCallback, useEffect, useState } from "react";
import {
    applicationApi,
    listingApi,
    type ApplicantWithStudent,
    type ApplicationStatus,
    type ScreeningQuestion,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

type DecidedStatus = Exclude<ApplicationStatus, "WITHDRAWN">;

// Denormalised listing context attached to every applicant row so the
// page can show "applied to <role>" without joining back to a listings
// map. Per-listing screening / skill-tag data also rides along because
// filtering by screening answer is per-listing.
export type AggregatedApplicant = ApplicantWithStudent & {
    listing: {
        id: string;
        title: string;
        skillTagsRaw: string[];
        screeningQuestions: ScreeningQuestion[];
    };
};

export type CompanyApplicantsState = {
    items: AggregatedApplicant[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
    updateStatus: (
        applicationId: string,
        status: DecidedStatus,
    ) => Promise<void>;
};

// Fans out a `list_applicants` request per listing the caller can see and
// flattens the responses. The caller passes the listings array (already
// fetched via useMyListings) so we don't re-fetch it here.
export function useCompanyApplicants(
    listings: ReadonlyArray<{ id: string; title: string }>,
): CompanyApplicantsState {
    const [items, setItems] = useState<AggregatedApplicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    // Re-fetch whenever the set of listing ids changes. We key on the
    // joined id string so a stable listings reference doesn't matter.
    const listingsKey = listings.map((l) => l.id).join(",");

    const fetchAll = useCallback(async () => {
        if (listings.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.all(
                listings.map(async (l) => {
                    const res = await listingApi.list_applicants(l.id);
                    return res.items.map((a) => ({
                        ...a,
                        listing: {
                            id: l.id,
                            title: l.title,
                            skillTagsRaw: res.skillTagsRaw ?? [],
                            screeningQuestions: res.screeningQuestions ?? [],
                        },
                    }));
                }),
            );
            setItems(results.flat());
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingsKey]);

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
        fetchAll();
    }, [fetchAll]);

    return {
        items,
        loading,
        error,
        refetch: fetchAll,
        updateStatus,
    };
}
