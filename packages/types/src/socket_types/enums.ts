/** Every `type` discriminator that travels over the chat socket. */
export enum MESSAGE_TYPE {
    // client -> server
    AUTH = "auth",
    SEND_MESSAGE = "send_message",
    MARK_READ = "mark_read",
    PING = "ping",
    // server -> client
    CONNECTED = "connected",
    MESSAGE_CREATED = "message_created",
    CONVERSATION_READ = "conversation_read",
    ERROR = "error",
    PONG = "pong",
}

/** Error codes the server may emit on the `error` message. */
export enum SOCKET_ERROR_CODE {
    UNAUTHORIZED = "unauthorized",
    INVALID_PAYLOAD = "invalid_payload",
    FORBIDDEN = "forbidden",
    NOT_FOUND = "not_found",
    INTERNAL = "internal",
}
