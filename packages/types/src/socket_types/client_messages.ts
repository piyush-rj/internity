import { z } from "zod";
import { MESSAGE_TYPE } from "./enums.ts";

export const ClientAuth = z.object({
    type: z.literal(MESSAGE_TYPE.AUTH),
    token: z.string().min(1),
});
export type ClientAuth = z.infer<typeof ClientAuth>;

export const ClientSendMessage = z.object({
    type: z.literal(MESSAGE_TYPE.SEND_MESSAGE),
    /** Local-only id so the client can reconcile the optimistic bubble. */
    clientId: z.string().min(1).max(64).optional(),
    conversationId: z.string().min(1),
    body: z.string().min(1).max(4000),
});
export type ClientSendMessage = z.infer<typeof ClientSendMessage>;

export const ClientEditMessage = z.object({
    type: z.literal(MESSAGE_TYPE.EDIT_MESSAGE),
    conversationId: z.string().min(1),
    messageId: z.string().min(1),
    body: z.string().min(1).max(4000),
});
export type ClientEditMessage = z.infer<typeof ClientEditMessage>;

export const ClientMarkRead = z.object({
    type: z.literal(MESSAGE_TYPE.MARK_READ),
    conversationId: z.string().min(1),
});
export type ClientMarkRead = z.infer<typeof ClientMarkRead>;

export const ClientPing = z.object({ type: z.literal(MESSAGE_TYPE.PING) });
export type ClientPing = z.infer<typeof ClientPing>;

export const ClientMessage = z.discriminatedUnion("type", [
    ClientAuth,
    ClientSendMessage,
    ClientEditMessage,
    ClientMarkRead,
    ClientPing,
]);
export type ClientMessage = z.infer<typeof ClientMessage>;
