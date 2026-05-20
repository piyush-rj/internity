/**
 * CustomWS — typed wrapper around the browser WebSocket used by the chat.
 *
 * The browser WS API has no per-message types and no Authorization header,
 * so this wrapper does two things:
 *
 *   1. holds the Supabase access token for the in-band auth handshake,
 *   2. exposes a typed `send(ClientMessage)` and `onMessage(ServerMessage)`
 *      interface keyed off the same discriminated unions as the backend.
 *
 * Pair with `useChatSocket` (a React hook) for the connection lifecycle.
 * This module is framework-agnostic so the same wrapper can be reused from
 * a non-React surface later (e.g. a service worker).
 */

import type { ClientMessage, ServerMessage } from "@/src/lib/ws/chat-types";

type Listener = (msg: ServerMessage) => void;

export type CustomWSOptions = {
    /** Fully qualified WS URL, e.g. `ws://localhost:8081/api/v1/chat/ws`. */
    url: string;
    /** Supabase access token used for in-band authentication. */
    token: string;
    /** Called the first time the server sends a `connected` ack. */
    onReady?: (userId: string) => void;
    /** Called on every parsed inbound message. */
    onMessage?: Listener;
    /** Called when the socket closes — fatal or otherwise. */
    onClose?: (event: CloseEvent) => void;
};

export class CustomWS {
    private ws: WebSocket;
    private listeners = new Set<Listener>();
    private readyResolved = false;

    readonly token: string;

    constructor(opts: CustomWSOptions) {
        this.token = opts.token;
        this.ws = new WebSocket(opts.url);

        this.ws.addEventListener("open", () => {
            // Auth must be the very first message after the socket opens.
            this.rawSend({ type: "auth", token: this.token });
        });

        this.ws.addEventListener("message", (ev) => {
            let parsed: ServerMessage | null = null;
            try {
                parsed = JSON.parse(ev.data) as ServerMessage;
            } catch {
                return;
            }
            if (
                !this.readyResolved &&
                parsed.type === "connected" &&
                opts.onReady
            ) {
                this.readyResolved = true;
                opts.onReady(parsed.userId);
            }
            opts.onMessage?.(parsed);
            for (const l of this.listeners) l(parsed);
        });

        if (opts.onClose) {
            this.ws.addEventListener("close", opts.onClose);
        }
    }

    /** Send a typed client message. Drops silently if the socket is closing. */
    send(msg: Exclude<ClientMessage, { type: "auth" }>): void {
        if (this.ws.readyState !== WebSocket.OPEN) return;
        this.rawSend(msg);
    }

    addListener(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    close(): void {
        if (
            this.ws.readyState === WebSocket.OPEN ||
            this.ws.readyState === WebSocket.CONNECTING
        ) {
            this.ws.close(1000, "client closing");
        }
    }

    get readyState(): number {
        return this.ws.readyState;
    }

    private rawSend(msg: ClientMessage): void {
        try {
            this.ws.send(JSON.stringify(msg));
        } catch {
            // The browser raises if the socket is in CLOSING/CLOSED — safe
            // to swallow since onclose will fire and the caller will react.
        }
    }
}

/** Build the WS URL from the configured backend HTTP URL. */
export function buildChatSocketUrl(backendHttpUrl: string): string {
    const u = new URL(backendHttpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    if (!u.pathname.endsWith("/")) u.pathname += "/";
    u.pathname += "api/v1/chat/ws";
    return u.toString();
}
