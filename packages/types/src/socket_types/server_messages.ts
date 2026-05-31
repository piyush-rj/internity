import { MESSAGE_TYPE, SOCKET_ERROR_CODE } from "./enums.ts";
import type { ChatMessage } from "./dtos.ts";

export type ServerConnected = {
    type: MESSAGE_TYPE.CONNECTED;
    userId: string;
};

export type ServerMessageCreated = {
    type: MESSAGE_TYPE.MESSAGE_CREATED;
    message: ChatMessage;
    /** Echoed back to the sender so the optimistic bubble can be reconciled. */
    clientId?: string;
};

/**
 * Broadcast to every participant when a message is edited by its sender.
 * Carries the full, updated message (including the new `editedAt`).
 */
export type ServerMessageUpdated = {
    type: MESSAGE_TYPE.MESSAGE_UPDATED;
    message: ChatMessage;
};

/**
 * Broadcast to every participant when one of them marks the conversation
 * as read. Sender's UI uses this to flip outbound ticks from sent → read.
 */
export type ServerConversationRead = {
    type: MESSAGE_TYPE.CONVERSATION_READ;
    conversationId: string;
    readerId: string;
    /** ISO-8601. Most recent message timestamp the reader has acknowledged. */
    readAt: string;
};

/**
 * Broadcast when a user's online state changes. Sent to every other
 * participant of any conversation the user is a member of.
 * `lastSeenAt` is null while the user is still online — it gets a value
 * the moment the last of their sockets disconnects.
 */
export type ServerUserPresence = {
    type: MESSAGE_TYPE.USER_PRESENCE;
    userId: string;
    isOnline: boolean;
    /** ISO-8601 or null when the user is currently online. */
    lastSeenAt: string | null;
};

export type ServerError = {
    type: MESSAGE_TYPE.ERROR;
    code: SOCKET_ERROR_CODE;
    message: string;
};

export type ServerPong = { type: MESSAGE_TYPE.PONG };

export type ServerMessage =
    | ServerConnected
    | ServerMessageCreated
    | ServerMessageUpdated
    | ServerConversationRead
    | ServerUserPresence
    | ServerError
    | ServerPong;
