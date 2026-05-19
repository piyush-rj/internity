/**
 * Wire-format types for the chat WebSocket.
 *
 * These mirror `apps/server/app/schemas/chat.py` exactly. The `type` field
 * is the discriminator on both sides — never add a message variant without
 * updating both files in the same change.
 */

// --- shared DTOs -----------------------------------------------------------

export type ChatMessage = {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    /** ISO-8601 timestamp from the server. */
    createdAt: string;
};

// --- client -> server ------------------------------------------------------

export type CAuth = { type: "auth"; token: string };
export type CSendMessage = {
    type: "send_message";
    conversationId: string;
    body: string;
};
export type CPing = { type: "ping" };

export type ClientMessage = CAuth | CSendMessage | CPing;

// --- server -> client ------------------------------------------------------

export type SConnected = { type: "connected"; userId: string };
export type SMessageCreated = { type: "message_created"; message: ChatMessage };
export type SError = {
    type: "error";
    code:
        | "unauthorized"
        | "invalid_payload"
        | "forbidden"
        | "not_found"
        | "internal";
    message: string;
};
export type SPong = { type: "pong" };

export type ServerMessage = SConnected | SMessageCreated | SError | SPong;

// --- REST DTOs -------------------------------------------------------------

export type ConversationPeer = {
    id: string;
    name: string | null;
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
    unread: boolean;
};
