import { create } from "zustand";
import { studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

type State = {
    profile: StudentProfile | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    initialized: boolean;

    init: () => Promise<void>;
    refetch: () => Promise<void>;
    reset: () => void;
};

/**
 * Shared cache of the calling user's StudentProfile.
 *
 * Multiple components (profile page, navbar completion pill, dashboards)
 * need this data; using a store keeps them on a single fetch instead of
 * each mounting its own.
 */
export const useMyProfileStore = create<State>((set, get) => {
    async function load() {
        set({ loading: true, error: null });
        try {
            const { profile } = await studentApi.get_me();
            set({ profile, loading: false, initialized: true });
        } catch (err) {
            // 404 just means "no profile yet" — not an error, that's a
            // valid initial state for new users.
            if (err instanceof ApiClientError && err.status === 404) {
                set({ profile: null, loading: false, initialized: true });
                return;
            }
            set({
                loading: false,
                error: err instanceof Error ? err : new Error(String(err)),
            });
        }
    }

    return {
        profile: null,
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
                profile: null,
                loading: false,
                error: null,
                initialized: false,
            }),
    };
});
