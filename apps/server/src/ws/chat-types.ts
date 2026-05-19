/**
 * WebSocket payload schemas for chat — Zod-validated, same wire format as
 * the frontend types at `apps/web/src/lib/ws/chat-types.ts`. The `type`
 * field is the discriminator on both sides; never add a variant here
 * without updating the frontend in the same change.
 */

import { z } from "zod";

// --- shared DTOs ------------------------------------------------------------

export const MessageDTO = z.object({
    id: z.string(),
    conversationId: z.string(),
    senderId: z.string(),
    body: z.string(),
    createdAt: z.string(), // ISO-8601
});
export type MessageDTO = z.infer<typeof MessageDTO>;

// --- client -> server -------------------------------------------------------

export const CAuth = z.object({
    type: z.literal("auth"),
    token: z.string().min(1),
});
export const CSendMessage = z.object({
    type: z.literal("send_message"),
    conversationId: z.string().min(1),
    body: z.string().min(1).max(4000),
});
export const CPing = z.object({ type: z.literal("ping") });

export const ClientMessage = z.discriminatedUnion("type", [
    CAuth,
    CSendMessage,
    CPing,
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

// --- server -> client -------------------------------------------------------

export type SConnected = { type: "connected"; userId: string };
export type SMessageCreated = { type: "message_created"; message: MessageDTO };
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

// --- REST DTOs --------------------------------------------------------------

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
