import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { manager } from "./socket.connection_manager.ts";
import { AuthFailed, CustomWS } from "./socket.custom.ts";
import {
    SocketDbService,
    type ConversationParticipants,
} from "./socket.db_services.ts";
import { MESSAGE_TYPE, SOCKET_ERROR_CODE, type ClientMessage } from "types";

// How often the server pings each open socket. A socket that hasn't
// answered with a pong since the previous tick is treated as dead and
// terminated — so presence goes stale by at most ~2 ticks.
const HEARTBEAT_INTERVAL_MS = 30_000;

export class ChatSocket {
    private readonly wss: WebSocketServer;
    // Authenticated, registered sockets — the set the heartbeat sweeps.
    private readonly liveConnections = new Set<CustomWS>();

    constructor(server: HttpServer, path: string) {
        this.wss = new WebSocketServer({ noServer: true });

        const heartbeat = setInterval(() => {
            for (const ws of this.liveConnections) {
                if (!ws.isAlive) {
                    ws.terminate();
                    continue;
                }
                ws.pingLiveness();
            }
        }, HEARTBEAT_INTERVAL_MS);
        this.wss.on("close", () => clearInterval(heartbeat));

        server.on("upgrade", (req, socket, head) => {
            try {
                const url = new URL(
                    req.url ?? "/",
                    `http://${req.headers.host ?? "localhost"}`,
                );
                if (url.pathname !== path) {
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(req, socket, head, (ws) => {
                    this.wss.emit("connection", ws, req);
                });
            } catch {
                socket.destroy();
            }
        });

        this.wss.on("connection", (rawWs) => {
            void this.handleConnection(rawWs);
        });
    }

    private async handleConnection(
        rawWs: ConstructorParameters<typeof CustomWS>[0],
    ): Promise<void> {
        const ws = new CustomWS(rawWs);

        let user;
        try {
            user = await ws.authenticate();
        } catch (err) {
            if (!(err instanceof AuthFailed)) {
                console.error("ws auth error:", err);
            }
            return;
        }

        ws.startHeartbeat();
        this.liveConnections.add(ws);

        const justCameOnline = manager.register(user.id, ws);
        if (justCameOnline) {
            void this.announcePresence(user.id, true);
        }

        ws.onMessage(async (msg) => {
            try {
                await this.handleMessage(ws, msg);
            } catch (err) {
                console.error("chat ws handler error:", err);
                ws.send({
                    type: MESSAGE_TYPE.ERROR,
                    code: SOCKET_ERROR_CODE.INTERNAL,
                    message: "Unexpected server error.",
                });
            }
        });

        ws.onClose(() => {
            this.liveConnections.delete(ws);
            const wentOffline = manager.unregister(user.id, ws);
            if (wentOffline) {
                void this.announcePresence(user.id, false);
            }
        });
    }

    // persists presence and fans it out to conversation peers
    private async announcePresence(
        userId: string,
        isOnline: boolean,
    ): Promise<void> {
        try {
            const now = new Date();
            const user = isOnline
                ? await SocketDbService.markUserOnline(userId)
                : await SocketDbService.markUserOffline(userId, now);
            const peerIds =
                await SocketDbService.getConversationPeerUserIds(userId);
            manager.sendToUsers(peerIds, {
                type: MESSAGE_TYPE.USER_PRESENCE,
                userId,
                isOnline,
                lastSeenAt:
                    isOnline || !user.lastSeenAt
                        ? null
                        : user.lastSeenAt.toISOString(),
            });
        } catch (err) {
            console.error("presence announce failed:", err);
        }
    }

    private async handleMessage(
        ws: CustomWS,
        msg: ClientMessage,
    ): Promise<void> {
        switch (msg.type) {
            case MESSAGE_TYPE.PING:
                ws.send({ type: MESSAGE_TYPE.PONG });
                return;
            case MESSAGE_TYPE.AUTH:
                ws.send({
                    type: MESSAGE_TYPE.ERROR,
                    code: SOCKET_ERROR_CODE.FORBIDDEN,
                    message: "Already authenticated.",
                });
                return;
            case MESSAGE_TYPE.SEND_MESSAGE:
                await this.handleSendMessage(
                    ws,
                    msg.conversationId,
                    msg.body,
                    msg.clientId,
                );
                return;
            case MESSAGE_TYPE.EDIT_MESSAGE:
                await this.handleEditMessage(
                    ws,
                    msg.conversationId,
                    msg.messageId,
                    msg.body,
                );
                return;
            case MESSAGE_TYPE.MARK_READ:
                await this.handleMarkRead(ws, msg.conversationId);
                return;
        }
    }

    private async handleSendMessage(
        ws: CustomWS,
        conversationId: string,
        body: string,
        clientId: string | undefined,
    ): Promise<void> {
        const conv = await SocketDbService.getConversation(conversationId);
        if (!conv) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.NOT_FOUND,
                message: "Conversation not found.",
            });
            return;
        }

        const participants = this.participantIds(conv);
        if (!participants.includes(ws.user.id)) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "Not a participant.",
            });
            return;
        }

        // Refuse to deliver into a dead inbox — the other side won't ever
        // read it and the sender deserves to know that up front rather than
        // sending into a void.
        const peerDeleted =
            ws.user.id === conv.studentId
                ? conv.recruiter.deletedAt
                : conv.student.deletedAt;
        if (peerDeleted) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "This person deleted their account.",
            });
            return;
        }

        const msg = await SocketDbService.createMessage(
            conversationId,
            ws.user.id,
            body,
        );
        await SocketDbService.touchConversationLastMessageAt(
            conversationId,
            msg.createdAt,
        );

        manager.sendToUsers(participants, {
            type: MESSAGE_TYPE.MESSAGE_CREATED,
            clientId,
            message: {
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                body: msg.body,
                createdAt: msg.createdAt.toISOString(),
                editedAt: msg.editedAt?.toISOString() ?? null,
            },
        });
    }

    private async handleEditMessage(
        ws: CustomWS,
        conversationId: string,
        messageId: string,
        body: string,
    ): Promise<void> {
        const conv = await SocketDbService.getConversation(conversationId);
        if (!conv) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.NOT_FOUND,
                message: "Conversation not found.",
            });
            return;
        }

        const participants = this.participantIds(conv);
        if (!participants.includes(ws.user.id)) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "Not a participant.",
            });
            return;
        }

        // Only the original sender may edit, and only a message that actually
        // belongs to this conversation — guards against forged ids.
        const existing = await SocketDbService.getMessageForEdit(messageId);
        if (!existing || existing.conversationId !== conversationId) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.NOT_FOUND,
                message: "Message not found.",
            });
            return;
        }
        if (existing.senderId !== ws.user.id) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "You can only edit your own messages.",
            });
            return;
        }
        const ONE_HOUR_MS = 60 * 60 * 1000;
        if (Date.now() - existing.createdAt.getTime() > ONE_HOUR_MS) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "Messages can only be edited within 1 hour of sending.",
            });
            return;
        }

        const updated = await SocketDbService.updateMessageBody(
            messageId,
            body,
            new Date(),
        );

        manager.sendToUsers(participants, {
            type: MESSAGE_TYPE.MESSAGE_UPDATED,
            message: {
                id: updated.id,
                conversationId: updated.conversationId,
                senderId: updated.senderId,
                body: updated.body,
                createdAt: updated.createdAt.toISOString(),
                editedAt: updated.editedAt?.toISOString() ?? null,
            },
        });
    }

    private async handleMarkRead(
        ws: CustomWS,
        conversationId: string,
    ): Promise<void> {
        const conv = await SocketDbService.getConversation(conversationId);
        if (!conv) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.NOT_FOUND,
                message: "Conversation not found.",
            });
            return;
        }

        const participants = this.participantIds(conv);
        if (!participants.includes(ws.user.id)) {
            ws.send({
                type: MESSAGE_TYPE.ERROR,
                code: SOCKET_ERROR_CODE.FORBIDDEN,
                message: "Not a participant.",
            });
            return;
        }

        const now = new Date();
        await SocketDbService.markConversationRead(
            conversationId,
            ws.user.id,
            now,
        );

        manager.sendToUsers(participants, {
            type: MESSAGE_TYPE.CONVERSATION_READ,
            conversationId,
            readerId: ws.user.id,
            readAt: now.toISOString(),
        });
    }

    // returns the deduped participant ids on a conversation
    private participantIds(conv: ConversationParticipants): string[] {
        return conv.studentId === conv.recruiterId
            ? [conv.studentId]
            : [conv.studentId, conv.recruiterId];
    }
}
