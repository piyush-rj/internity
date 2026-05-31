import { z } from "zod";

/** A single chat message as it travels on the wire and over REST. */
export const ChatMessage = z.object({
    id: z.string(),
    conversationId: z.string(),
    senderId: z.string(),
    body: z.string(),
    /** ISO-8601 timestamp from the server. */
    createdAt: z.string(),
    /** ISO-8601 of the last edit, or null if the message was never edited. */
    editedAt: z.string().nullable(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export type ConversationPeer = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    /** True iff the peer currently has at least one open chat socket. */
    isOnline: boolean;
    /**
     * ISO-8601 of the last time the peer was online, or null if they have
     * never been seen. Always null while `isOnline` is true.
     */
    lastSeenAt: string | null;
    /**
     * ISO-8601 of when the peer deleted their account, or null. When set,
     * the thread should render anonymized and the input should be disabled.
     */
    deletedAt: string | null;
};

export type ConversationListItem = {
    id: string;
    /**
     * Most recent Application pinned to this thread. Null only in the
     * degenerate case where every application has been deleted but the
     * thread still has messages.
     */
    applicationId: string | null;
    listingId: string | null;
    listingTitle: string | null;
    companyName: string | null;
    /**
     * Additional applications attached to this thread beyond the primary
     * one. Lets the UI render "Frontend Engineer + 2 more" without a second
     * round-trip.
     */
    otherRolesCount: number;
    peer: ConversationPeer;
    lastMessageAt: string;
    lastMessagePreview: string | null;
    /** Count of messages newer than the viewer's lastReadAt. */
    unreadCount: number;
    /** ISO-8601. Most recent message the peer has acknowledged. */
    peerLastReadAt: string | null;
};
