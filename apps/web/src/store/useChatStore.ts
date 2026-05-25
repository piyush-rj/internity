import { create } from "zustand";

type State = {
    unreadByConv: Record<string, number>;
};

type Actions = {
    setUnread: (map: Record<string, number>) => void;
    bumpUnread: (conversationId: string) => void;
    clearUnread: (conversationId: string) => void;
    reset: () => void;
};

export const useChatStore = create<State & Actions>((set) => ({
    unreadByConv: {},

    setUnread: (map) => set({ unreadByConv: map }),

    bumpUnread: (conversationId) =>
        set((s) => ({
            unreadByConv: {
                ...s.unreadByConv,
                [conversationId]: (s.unreadByConv[conversationId] ?? 0) + 1,
            },
        })),

    clearUnread: (conversationId) =>
        set((s) => {
            if (!s.unreadByConv[conversationId]) return s;
            const next = { ...s.unreadByConv };
            delete next[conversationId];
            return { unreadByConv: next };
        }),

    reset: () => set({ unreadByConv: {} }),
}));

// total unread for the sidebar badge
export function selectTotalUnread(s: { unreadByConv: Record<string, number> }) {
    let total = 0;
    for (const k in s.unreadByConv) total += s.unreadByConv[k] ?? 0;
    return total;
}
