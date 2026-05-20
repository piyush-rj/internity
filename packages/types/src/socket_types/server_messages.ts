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

export type ServerError = {
    type: MESSAGE_TYPE.ERROR;
    code: SOCKET_ERROR_CODE;
    message: string;
};

export type ServerPong = { type: MESSAGE_TYPE.PONG };

export type ServerMessage =
    | ServerConnected
    | ServerMessageCreated
    | ServerConversationRead
    | ServerError
    | ServerPong;
