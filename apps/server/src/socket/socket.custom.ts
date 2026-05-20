import type { WebSocket } from "ws";
import { verifyToken } from "../core/jwt.ts";
import type { UserRole } from "../db.ts";
import { SocketDbService } from "./socket.db_services.ts";
import {
    ClientMessage,
    type ClientMessage as ClientMessageT,
    type ServerMessage,
} from "../types/types.socket.ts";

export const WS_CLOSE_UNAUTHORIZED = 4401;
export const WS_CLOSE_TIMEOUT = 4408;
export const WS_CLOSE_INVALID_PAYLOAD = 4400;

const AUTH_TIMEOUT_MS = 10_000;

export type WSUser = {
    id: string; // public.User.id (cuid)
    name: string | null;
    email: string | null;
    role: UserRole;
};

export class AuthFailed extends Error {
    constructor(reason: string) {
        super(reason);
        this.name = "AuthFailed";
    }
}

export class CustomWS {
    private _user: WSUser | null = null;

    constructor(private readonly ws: WebSocket) {}

    get user(): WSUser {
        if (this._user === null) {
            throw new Error(
                "CustomWS.user accessed before authenticate() succeeded",
            );
        }
        return this._user;
    }

    get isAuthenticated(): boolean {
        return this._user !== null;
    }

    /**
     * Wait for the first message, parse it as an auth payload, verify the
     * Supabase token, and resolve to a `WSUser`. Closes with a 4401-class
     * code and throws `AuthFailed` on any error.
     */
    async authenticate(): Promise<WSUser> {
        const raw = await this.recvRawWithTimeout(AUTH_TIMEOUT_MS).catch(
            (err: unknown) => {
                if (err instanceof Error && err.message === "timeout") {
                    return this.failHandshake(
                        WS_CLOSE_TIMEOUT,
                        "unauthorized",
                        "Auth message not received in time.",
                    );
                }
                throw new AuthFailed(
                    err instanceof Error
                        ? err.message
                        : "socket closed during auth",
                );
            },
        );

        let parsed: ClientMessageT;
        try {
            parsed = ClientMessage.parse(JSON.parse(raw));
        } catch (err) {
            this.failHandshake(
                WS_CLOSE_INVALID_PAYLOAD,
                "invalid_payload",
                `Malformed auth message: ${err instanceof Error ? err.message : "parse failed"}`,
            );
            throw new AuthFailed("malformed auth payload");
        }

        if (parsed.type !== "auth") {
            this.failHandshake(
                WS_CLOSE_UNAUTHORIZED,
                "unauthorized",
                "First message must be of type 'auth'.",
            );
            throw new AuthFailed("first message was not 'auth'");
        }

        const claims = await verifyToken(parsed.token);
        if (!claims?.sub) {
            this.failHandshake(
                WS_CLOSE_UNAUTHORIZED,
                "unauthorized",
                "Invalid token.",
            );
            throw new AuthFailed("invalid token");
        }

        const supabaseUserId = claims.sub;
        const email = claims.email ?? null;
        const phone = claims.phone ?? null;

        let user = await SocketDbService.findUserBySupabaseId(supabaseUserId);
        if (!user && (email || phone)) {
            user = await SocketDbService.findUserByEmailOrPhone(email, phone);
            if (user && user.supabaseUserId === null) {
                user = await SocketDbService.linkSupabaseUserId(
                    user.id,
                    supabaseUserId,
                );
            }
        }

        if (!user) {
            this.failHandshake(
                WS_CLOSE_UNAUTHORIZED,
                "unauthorized",
                "No matching user.",
            );
            throw new AuthFailed("user not found");
        }

        this._user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        this.send({ type: "connected", userId: user.id });
        return this._user;
    }

    // ------------------------------------------------------------------ io

    /** Send a typed server message. Drops silently if the socket isn't open. */
    send(msg: ServerMessage): void {
        if (this.ws.readyState !== this.ws.OPEN) return;
        try {
            this.ws.send(JSON.stringify(msg));
        } catch {
            // Best-effort: connection dying mid-send is fine — onclose will fire.
        }
    }

    /**
     * Register a handler for parsed client messages. Throws away
     * unparseable frames after sending an `invalid_payload` reply.
     */
    onMessage(handler: (msg: ClientMessageT) => void | Promise<void>): void {
        this.ws.on("message", async (data) => {
            let parsed: ClientMessageT;
            try {
                parsed = ClientMessage.parse(JSON.parse(data.toString()));
            } catch (err) {
                this.send({
                    type: "error",
                    code: "invalid_payload",
                    message:
                        err instanceof Error
                            ? err.message
                            : "Invalid JSON payload",
                });
                return;
            }
            await handler(parsed);
        });
    }

    onClose(handler: () => void): void {
        this.ws.on("close", handler);
    }

    close(code = 1000, reason = ""): void {
        if (
            this.ws.readyState === this.ws.OPEN ||
            this.ws.readyState === this.ws.CONNECTING
        ) {
            this.ws.close(code, reason);
        }
    }

    // ------------------------------------------------------------------ helpers

    private recvRawWithTimeout(timeoutMs: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error("timeout"));
            }, timeoutMs);

            const onMessage = (data: unknown) => {
                cleanup();
                const buf = data as Buffer;
                resolve(buf.toString());
            };
            const onClose = () => {
                cleanup();
                reject(new Error("closed"));
            };
            const cleanup = () => {
                clearTimeout(timer);
                this.ws.off("message", onMessage);
                this.ws.off("close", onClose);
            };

            this.ws.once("message", onMessage);
            this.ws.once("close", onClose);
        });
    }

    private failHandshake(
        closeCode: number,
        errorCode:
            | "unauthorized"
            | "invalid_payload"
            | "forbidden"
            | "not_found"
            | "internal",
        message: string,
    ): never {
        // Send the typed error before close so the client can show a reason.
        if (this.ws.readyState === this.ws.OPEN) {
            try {
                this.ws.send(
                    JSON.stringify({
                        type: "error",
                        code: errorCode,
                        message,
                    } satisfies ServerMessage),
                );
            } catch {}
        }
        this.close(closeCode, message.slice(0, 120));
        throw new AuthFailed(message);
    }
}
