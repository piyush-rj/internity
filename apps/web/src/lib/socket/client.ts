import { MESSAGE_TYPE, type ClientMessage, type ServerMessage } from "types";

export type WSStatus = "connecting" | "open" | "closed";

const WS_CLOSE_NORMAL = 1000;
const WS_CLOSE_UNAUTHORIZED = 4401;

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type WSClientOptions = {
    url: string;
    getToken: () => Promise<string | null>;
    onStatus?: (status: WSStatus) => void;
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

    // sends a typed client message; drops silently if not open
    send(msg: Exclude<ClientMessage, { type: MESSAGE_TYPE.AUTH }>): void {
        const ws = this.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try {
            ws.send(JSON.stringify(msg));
        } catch {
        }
    }

    addListener(listener: (msg: ServerMessage) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    // tears the client down with no further reconnects
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

// builds a ws url by swapping the protocol on the backend http url
export function buildSocketUrl(backendHttpUrl: string, path: string): string {
    const u = new URL(backendHttpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    if (!u.pathname.endsWith("/")) u.pathname += "/";
    u.pathname += path.startsWith("/") ? path.slice(1) : path;
    return u.toString();
}
