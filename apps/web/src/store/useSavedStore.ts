import { create } from "zustand";
import { savedApi, type ListingWithCompany } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type SavedItem = {
    listingId: string;
    createdAt: string;
    listing: ListingWithCompany;
};

type SavedStore = {
    savedIds: Record<string, true>;
    items: SavedItem[];
    loading: boolean;
    error: ApiClientError | Error | null;
    initialized: boolean;

    init: () => Promise<void>;
    refetch: () => Promise<void>;
    save: (listing: ListingWithCompany) => Promise<void>;
    unsave: (listingId: string) => Promise<void>;
    toggle: (listing: ListingWithCompany) => Promise<void>;
};

export const useSavedStore = create<SavedStore>((set, get) => {
    async function load() {
        set({ loading: true, error: null });
        try {
            const { items } = await savedApi.list();
            const map: Record<string, true> = {};
            for (const it of items) map[it.listingId] = true;
            set({
                items,
                savedIds: map,
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
        savedIds: {},
        items: [],
        loading: false,
        error: null,
        initialized: false,

        init: async () => {
            if (get().initialized || get().loading) return;
            await load();
        },
        refetch: load,

        save: async (listing) => {
            const id = listing.id;
            if (get().savedIds[id]) return;
            const optimistic: SavedItem = {
                listingId: id,
                createdAt: new Date().toISOString(),
                listing,
            };
            set((s) => ({
                savedIds: { ...s.savedIds, [id]: true },
                items: [optimistic, ...s.items],
            }));
            try {
                await savedApi.save(id);
            } catch (err) {
                set((s) => {
                    const next = { ...s.savedIds };
                    delete next[id];
                    return {
                        savedIds: next,
                        items: s.items.filter((it) => it.listingId !== id),
                        error:
                            err instanceof Error ? err : new Error(String(err)),
                    };
                });
            }
        },

        unsave: async (listingId) => {
            if (!get().savedIds[listingId]) return;
            const prevItems = get().items;
            set((s) => {
                const next = { ...s.savedIds };
                delete next[listingId];
                return {
                    savedIds: next,
                    items: s.items.filter((it) => it.listingId !== listingId),
                };
            });
            try {
                await savedApi.unsave(listingId);
            } catch (err) {
                set((s) => ({
                    savedIds: { ...s.savedIds, [listingId]: true },
                    items: prevItems,
                    error: err instanceof Error ? err : new Error(String(err)),
                }));
            }
        },

        toggle: async (listing) => {
            const id = listing.id;
            if (get().savedIds[id]) await get().unsave(id);
            else await get().save(listing);
        },
    };
});

export const useIsSaved = (listingId: string) =>
    useSavedStore((s) => !!s.savedIds[listingId]);
