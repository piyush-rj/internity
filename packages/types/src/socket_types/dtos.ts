import { z } from "zod";

/** A single chat message as it travels on the wire and over REST. */
export const ChatMessage = z.object({
    id: z.string(),
    conversationId: z.string(),
    senderId: z.string(),
    body: z.string(),
    /** ISO-8601 timestamp from the server. */
    createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export type ConversationPeer = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
};

export type ConversationListItem = {
    id: string;
    applicationId: string;
    listingId: string;
    listingTitle: string;
    companyName: string;
    peer: ConversationPeer;
    lastMessageAt: string;
    lastMessagePreview: string | null;
    /** Count of messages newer than the viewer's lastReadAt. */
    unreadCount: number;
    /** ISO-8601. Most recent message the peer has acknowledged. */
    peerLastReadAt: string | null;
};
