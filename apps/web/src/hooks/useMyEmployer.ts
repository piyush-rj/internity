"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
    employerApi,
    type Company,
    type CompanyMember,
    type EmployerProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type EmployerMembership = CompanyMember & { company: Company };

export type ListingQuota = { remaining: number | null; total: number | null } | null;

export type EmployerState = {
    profile: EmployerProfile | null;
    memberships: EmployerMembership[];
    listingQuota: ListingQuota;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

type EmployerStore = {
    profile: EmployerProfile | null;
    memberships: EmployerMembership[];
    listingQuota: ListingQuota;
    loading: boolean;
    initialized: boolean;
    error: ApiClientError | Error | null;
    init: () => Promise<void>;
    refetch: () => Promise<void>;
    reset: () => void;
};

// Single shared source of truth for the signed-in user's employer profile and
// company memberships. Backing useMyEmployer() with one store -- rather than a
// fetch per component instance -- means a refetch from anywhere (e.g. right
// after creating a company) propagates to every consumer, including the
// sidebar's Company section, with no page reload required.
export const useEmployerStore = create<EmployerStore>((set, get) => {
    async function load() {
        set({ loading: true, error: null });
        try {
            const data = await employerApi.get_me();
            set({
                profile: data.profile,
                memberships: data.memberships,
                listingQuota: data.listingQuota,
                loading: false,
                initialized: true,
            });
        } catch (err) {
            // 404 = the user has no employer profile yet; that's a valid empty
            // state, not an error.
            if (err instanceof ApiClientError && err.status === 404) {
                set({
                    profile: null,
                    memberships: [],
                    loading: false,
                    initialized: true,
                });
            } else {
                set({
                    error: err instanceof Error ? err : new Error(String(err)),
                    loading: false,
                    initialized: true,
                });
            }
        }
    }

    return {
        profile: null,
        memberships: [],
        listingQuota: null,
        loading: false,
        initialized: false,
        error: null,
        init: async () => {
            if (get().initialized || get().loading) return;
            await load();
        },
        refetch: load,
        reset: () =>
            set({
                profile: null,
                memberships: [],
                listingQuota: null,
                loading: false,
                initialized: false,
                error: null,
            }),
    };
});

export function useMyEmployer(): EmployerState {
    const profile = useEmployerStore((s) => s.profile);
    const memberships = useEmployerStore((s) => s.memberships);
    const listingQuota = useEmployerStore((s) => s.listingQuota);
    const loading = useEmployerStore((s) => s.loading);
    const initialized = useEmployerStore((s) => s.initialized);
    const error = useEmployerStore((s) => s.error);
    const init = useEmployerStore((s) => s.init);
    const refetch = useEmployerStore((s) => s.refetch);

    useEffect(() => {
        // Fetch once on first mount; later mounts reuse the shared store.
        init();
    }, [init]);

    // Preserve the previous contract: report "loading" until the first fetch
    // resolves, so callers that gate skeletons on `loading` behave as before.
    return {
        profile,
        memberships,
        listingQuota,
        loading: loading || !initialized,
        error,
        refetch,
    };
}
