import { create } from "zustand";
import { applicationApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

type AppliedStore = {
    appliedIds: Record<string, true>;
    loading: boolean;
    error: ApiClientError | Error | null;
    initialized: boolean;

    init: () => Promise<void>;
    refetch: () => Promise<void>;
    markApplied: (listingId: string) => void;
    reset: () => void;
};

export const useAppliedStore = create<AppliedStore>((set, get) => {
    async function load() {
        set({ loading: true, error: null });
        try {
            const { items } = await applicationApi.list_mine();
            const map: Record<string, true> = {};
            for (const it of items) map[it.listingId] = true;
            set({
                appliedIds: map,
                loading: false,
                initialized: true,
            });
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err : new Error(String(err)),
            });
        }
    }

    return {
        appliedIds: {},
        loading: false,
        error: null,
        initialized: false,

        init: async () => {
            if (get().initialized || get().loading) return;
            await load();
        },
        refetch: load,
        markApplied: (listingId) =>
            set((s) => ({
                appliedIds: { ...s.appliedIds, [listingId]: true },
            })),
        reset: () =>
            set({
                appliedIds: {},
                loading: false,
                error: null,
                initialized: false,
            }),
    };
});

export function useIsApplied(listingId: string): boolean {
    return useAppliedStore((s) => !!s.appliedIds[listingId]);
}
