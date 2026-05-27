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

export type ListingApplicantsState = {
    items: ApplicantWithStudent[];
    screeningQuestions: ScreeningQuestion[];
    skillTagsRaw: string[];
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
    const [screeningQuestions, setScreeningQuestions] = useState<
        ScreeningQuestion[]
    >([]);
    const [skillTagsRaw, setSkillTagsRaw] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchApplicants = useCallback(async () => {
        if (!listingId) {
            setItems([]);
            setScreeningQuestions([]);
            setSkillTagsRaw([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await listingApi.list_applicants(listingId);
            setItems(res.items);
            setScreeningQuestions(res.screeningQuestions ?? []);
            setSkillTagsRaw(res.skillTagsRaw ?? []);
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
        screeningQuestions,
        skillTagsRaw,
        loading,
        error,
        refetch: fetchApplicants,
        updateStatus,
    };
}
