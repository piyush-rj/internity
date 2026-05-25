import { create } from "zustand";

type Presence = {
    isOnline: boolean;
    lastSeenAt: string | null;
};

type State = {
    presenceByUser: Record<string, Presence>;
};

type Actions = {
    setPresence: (userId: string, p: Presence) => void;
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
