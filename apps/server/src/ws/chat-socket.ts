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
import { prisma } from "../db.ts";
import { manager } from "./connection-manager.ts";
import { AuthFailed, CustomWS } from "./custom-ws.ts";
import type { ClientMessage } from "./chat-types.ts";

export function mountChatWebSocket(server: HttpServer, path: string): void {
    const wss = new WebSocketServer({ noServer: true });

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
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        } catch {
            socket.destroy();
        }
    });

    wss.on("connection", async (rawWs) => {
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
                await handleMessage(ws, msg);
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
    });
}

async function handleMessage(
    ws: CustomWS,
    msg: ClientMessage,
): Promise<void> {
    switch (msg.type) {
        case "ping":
            ws.send({ type: "pong" });
            return;
        case "auth":
            // Already authenticated — reject re-auth so a stale client can't
            // silently rotate identity mid-session.
            ws.send({
                type: "error",
                code: "forbidden",
                message: "Already authenticated.",
            });
            return;
        case "send_message":
            await handleSendMessage(ws, msg.conversationId, msg.body);
            return;
    }
}

async function handleSendMessage(
    ws: CustomWS,
    conversationId: string,
    body: string,
): Promise<void> {
    const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { application: { include: { listing: true } } },
    });
    if (!conv) {
        ws.send({
            type: "error",
            code: "not_found",
            message: "Conversation not found.",
        });
        return;
    }

    const members = await prisma.companyMember.findMany({
        where: { companyId: conv.application.listing.companyId },
        select: { userId: true },
    });
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

    const msg = await prisma.message.create({
        data: { conversationId, senderId: ws.user.id, body },
    });
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: msg.createdAt },
    });

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
