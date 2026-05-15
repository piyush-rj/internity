import { create } from "zustand";
import { authApi, type MeResponse } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

type MeStore = {
    me: MeResponse | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    initialized: boolean;

    init: () => Promise<void>;
    refetch: () => Promise<void>;
    reset: () => void;
};

export const useMeStore = create<MeStore>((set, get) => {
    async function load() {
        set({ loading: true, error: null });
        try {
            const me = await authApi.me();
            set({ me, loading: false, initialized: true });
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err : new Error(String(err)),
            });
        }
    }

    return {
        me: null,
        loading: false,
        error: null,
        initialized: false,

        init: async () => {
            if (get().initialized || get().loading) return;
            await load();
        },
        refetch: load,
        reset: () =>
            set({
                me: null,
                loading: false,
                error: null,
                initialized: false,
            }),
    };
});
