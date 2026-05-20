/**
 * WSClient — typed browser WebSocket with auto-reconnect.
 *
 * One persistent connection per instance. The auth token is fetched fresh
 * on every (re)connect so a long-lived client survives token rotation. The
 * client never gives up on transient drops; close code 1000 (normal) or
 * 4401 (unauthorized) are the only terminal states.
 */

import { MESSAGE_TYPE, type ClientMessage, type ServerMessage } from "types";

export type WSStatus = "connecting" | "open" | "closed";

const WS_CLOSE_NORMAL = 1000;
const WS_CLOSE_UNAUTHORIZED = 4401;

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type WSClientOptions = {
    /** Fully qualified WS URL, e.g. `ws://localhost:8081/api/v1/chat/ws`. */
    url: string;
    /** Called before each (re)connect — returns the current Supabase token. */
    getToken: () => Promise<string | null>;
    /** Notified on every status transition. */
    onStatus?: (status: WSStatus) => void;
    /** Notified for every inbound message. */
    onMessage?: (msg: ServerMessage) => void;
};

export class WSClient {
    private ws: WebSocket | null = null;
    private destroyed = false;
    private reconnectAttempt = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly listeners = new Set<(msg: ServerMessage) => void>();

    constructor(private readonly opts: WSClientOptions) {
        void this.connect();
    }

    /** Send a typed client message. Drops silently if not open. */
    send(msg: Exclude<ClientMessage, { type: MESSAGE_TYPE.AUTH }>): void {
        const ws = this.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try {
            ws.send(JSON.stringify(msg));
        } catch {
            // Socket dying mid-send — the close handler will react.
        }
    }

    addListener(listener: (msg: ServerMessage) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /** Tear the client down. No further reconnects after this. */
    close(): void {
        this.destroyed = true;
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        const ws = this.ws;
        this.ws = null;
        if (
            ws &&
            (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING)
        ) {
            ws.close(WS_CLOSE_NORMAL, "client closing");
        }
    }

    private async connect(): Promise<void> {
        if (this.destroyed) return;

        const token = await this.opts.getToken();
        if (this.destroyed) return;
        if (!token) {
            // No session yet — leave us closed; consumer can call back later.
            this.opts.onStatus?.("closed");
            return;
        }

        this.opts.onStatus?.("connecting");

        const ws = new WebSocket(this.opts.url);
        this.ws = ws;

        ws.addEventListener("open", () => {
            try {
                ws.send(
                    JSON.stringify({
                        type: MESSAGE_TYPE.AUTH,
                        token,
                    }),
                );
            } catch {
                // Will close — handler below kicks reconnect.
            }
        });

        ws.addEventListener("message", (ev) => {
            let msg: ServerMessage;
            try {
                msg = JSON.parse(ev.data) as ServerMessage;
            } catch {
                return;
            }
            if (msg.type === MESSAGE_TYPE.CONNECTED) {
                this.reconnectAttempt = 0;
                this.opts.onStatus?.("open");
            }
            this.opts.onMessage?.(msg);
            for (const l of this.listeners) l(msg);
        });

        ws.addEventListener("close", (ev) => {
            this.ws = null;
            this.opts.onStatus?.("closed");
            if (this.destroyed) return;
            // 1000 = our own close(); 4401 = server rejected auth.
            if (
                ev.code === WS_CLOSE_NORMAL ||
                ev.code === WS_CLOSE_UNAUTHORIZED
            ) {
                return;
            }
            this.scheduleReconnect();
        });
    }

    private scheduleReconnect(): void {
        if (this.destroyed) return;
        const delay = Math.min(
            INITIAL_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt,
            MAX_RECONNECT_DELAY_MS,
        );
        this.reconnectAttempt += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            void this.connect();
        }, delay);
    }
}

/** Build a WS URL by swapping the protocol on the backend HTTP URL. */
export function buildSocketUrl(backendHttpUrl: string, path: string): string {
    const u = new URL(backendHttpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    if (!u.pathname.endsWith("/")) u.pathname += "/";
    u.pathname += path.startsWith("/") ? path.slice(1) : path;
    return u.toString();
}
