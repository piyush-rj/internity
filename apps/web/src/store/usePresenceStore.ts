import { create } from "zustand";

/**
 * Realtime online/last-seen state for every user we're aware of, fed by
 * the chat socket's `user_presence` broadcasts. Components read from here
 * instead of trusting the snapshot they got from REST, so the chat header
 * flips to "Online" the instant the peer connects.
 */
type Presence = {
    isOnline: boolean;
    /** ISO-8601 or null. Always null while `isOnline` is true. */
    lastSeenAt: string | null;
};

type State = {
    presenceByUser: Record<string, Presence>;
};

type Actions = {
    setPresence: (userId: string, p: Presence) => void;
    /** Seed multiple users at once — used after fetching the chat list. */
    seedPresence: (entries: Array<{ userId: string } & Presence>) => void;
    reset: () => void;
};

export const usePresenceStore = create<State & Actions>((set) => ({
    presenceByUser: {},

    setPresence: (userId, p) =>
        set((s) => ({
            presenceByUser: { ...s.presenceByUser, [userId]: p },
        })),

    seedPresence: (entries) =>
        set((s) => {
            const next = { ...s.presenceByUser };
            for (const e of entries) {
                next[e.userId] = {
                    isOnline: e.isOnline,
                    lastSeenAt: e.lastSeenAt,
                };
            }
            return { presenceByUser: next };
        }),

    reset: () => set({ presenceByUser: {} }),
}));
