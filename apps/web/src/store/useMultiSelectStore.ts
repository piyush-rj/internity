"use client";

import { create } from "zustand";
import type { ListingWithCompany } from "@/src/lib/api";

/**
 * Tracks the student's current multi-apply selection across the browse page.
 * Stored at module scope (not in the route) so selection survives navigation
 * within /home/internships and /home/jobs — students can flip between tabs
 * and keep their picks. Cleared explicitly on dialog close or successful
 * apply.
 */
interface MultiSelectState {
    selected: Map<string, ListingWithCompany>;
    add: (listing: ListingWithCompany) => void;
    remove: (listingId: string) => void;
    toggle: (listing: ListingWithCompany) => void;
    clear: () => void;
}

export const useMultiSelectStore = create<MultiSelectState>((set, get) => ({
    selected: new Map(),
    add: (listing) =>
        set((s) => {
            const next = new Map(s.selected);
            next.set(listing.id, listing);
            return { selected: next };
        }),
    remove: (listingId) =>
        set((s) => {
            if (!s.selected.has(listingId)) return s;
            const next = new Map(s.selected);
            next.delete(listingId);
            return { selected: next };
        }),
    toggle: (listing) => {
        const cur = get().selected;
        if (cur.has(listing.id)) get().remove(listing.id);
        else get().add(listing);
    },
    clear: () => set({ selected: new Map() }),
}));
