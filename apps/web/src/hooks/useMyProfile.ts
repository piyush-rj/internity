"use client";
import { useEffect } from "react";
import type { StudentProfile } from "@/src/lib/api";
import type { ApiClientError } from "@/src/lib/apiClient";
import { useMyProfileStore } from "@/src/store/useMyProfileStore";

export type ProfileState = {
    profile: StudentProfile | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

/**
 * Thin wrapper around the shared profile store. Triggers init on mount so
 * the first consumer drives the fetch and later mounts get the cached value.
 */
export function useMyProfile(): ProfileState {
    const profile = useMyProfileStore((s) => s.profile);
    const loading = useMyProfileStore((s) => s.loading);
    const error = useMyProfileStore((s) => s.error);
    const init = useMyProfileStore((s) => s.init);
    const refetch = useMyProfileStore((s) => s.refetch);

    useEffect(() => {
        init();
    }, [init]);

    return { profile, loading, error, refetch };
}
