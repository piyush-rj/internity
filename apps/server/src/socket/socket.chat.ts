/**
 * Mount the chat WebSocket on an HTTP server.
 *
 * One persistent socket per user — messages address conversations by id in
 * the payload, not by URL. Flow:
 *
 *   1. Client opens WS to `/api/v1/chat/ws`.
 *   2. CustomWS.authenticate() waits for an `auth` message, verifies the
 *      Supabase JWT, and binds the user identity.
 *   3. The socket is registered with the ConnectionManager.
 *   4. The read loop dispatches `ping`, rejects re-auth attempts, and
 *      handles `send_message` by persisting + fanning out to participants.
 */

import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { manager } from "./socket.connection_manager.ts";
import { AuthFailed, CustomWS } from "./socket.custom.ts";
import { SocketDbService } from "./socket.db_services.ts";
import type { ClientMessage } from "../types/types.socket.ts";

export class ChatSocket {
    private readonly wss: WebSocketServer;

    constructor(server: HttpServer, path: string) {
        this.wss = new WebSocketServer({ noServer: true });

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

        manager.register(user.id, ws);

        ws.onMessage(async (msg) => {
            try {
                await this.handleMessage(ws, msg);
            } catch (err) {
                console.error("chat ws handler error:", err);
                ws.send({
                    type: "error",
                    code: "internal",
                    message: "Unexpected server error.",
                });
            }
        });

        ws.onClose(() => {
            manager.unregister(user.id, ws);
        });
    }

    private async handleMessage(
        ws: CustomWS,
        msg: ClientMessage,
    ): Promise<void> {
        switch (msg.type) {
            case "ping":
                ws.send({ type: "pong" });
                return;
            case "auth":
                ws.send({
                    type: "error",
                    code: "forbidden",
                    message: "Already authenticated.",
                });
                return;
            case "send_message":
                await this.handleSendMessage(ws, msg.conversationId, msg.body);
                return;
        }
    }

    private async handleSendMessage(
        ws: CustomWS,
        conversationId: string,
        body: string,
    ): Promise<void> {
        const conv =
            await SocketDbService.getConversationWithListing(conversationId);
        if (!conv) {
            ws.send({
                type: "error",
                code: "not_found",
                message: "Conversation not found.",
            });
            return;
        }

        const members = await SocketDbService.getCompanyMemberUserIds(
            conv.application.listing.companyId,
        );
        const participants = Array.from(
            new Set<string>([
                conv.application.studentId,
                ...members.map((m) => m.userId),
            ]),
        );
        if (!participants.includes(ws.user.id)) {
            ws.send({
                type: "error",
                code: "forbidden",
                message: "Not a participant.",
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
            type: "message_created",
            message: {
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                body: msg.body,
                createdAt: msg.createdAt.toISOString(),
            },
        });
    }
}
