import { create } from "zustand";

/**
 * In-memory mirror of "unread message counts" per conversation for the
 * currently signed-in user. Kept in sync by:
 *   - initial seed from GET /chat/conversations,
 *   - +1 on every inbound `message_created` from someone else,
 *   - cleared when this user marks the conversation read.
 *
 * The sidebar badge derives its total from `unreadByConv`; the messages page
 * uses the per-conv counts to show pills next to each conversation.
 */
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

/** Derived total for the sidebar badge. */
export function selectTotalUnread(s: { unreadByConv: Record<string, number> }) {
    let total = 0;
    for (const k in s.unreadByConv) total += s.unreadByConv[k] ?? 0;
    return total;
}
