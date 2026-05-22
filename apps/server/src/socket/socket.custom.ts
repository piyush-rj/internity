import type { WebSocket } from "ws";
import { verifyToken } from "../core/jwt.ts";
import type { UserRole } from "../db.ts";
import { SocketDbService, type User } from "./socket.db_services.ts";
import {
    ClientMessage,
    MESSAGE_TYPE,
    SOCKET_ERROR_CODE,
    type ClientMessage as ClientMessageT,
    type ServerMessage,
} from "types";

export const WS_CLOSE_UNAUTHORIZED = 4401;
export const WS_CLOSE_TIMEOUT = 4408;
export const WS_CLOSE_INVALID_PAYLOAD = 4400;

const AUTH_TIMEOUT_MS = 10_000;

export type WSUser = {
    id: string;
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

    async authenticate(): Promise<WSUser> {
        const raw = await this.recvRawWithTimeout(AUTH_TIMEOUT_MS).catch(
            (err: unknown) => {
                if (err instanceof Error && err.message === "timeout") {
                    return this.failHandshake(
                        WS_CLOSE_TIMEOUT,
                        SOCKET_ERROR_CODE.UNAUTHORIZED,
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
                SOCKET_ERROR_CODE.INVALID_PAYLOAD,
                `Malformed auth message: ${err instanceof Error ? err.message : "parse failed"}`,
            );
            throw new AuthFailed("malformed auth payload");
        }

        if (parsed.type !== MESSAGE_TYPE.AUTH) {
            this.failHandshake(
                WS_CLOSE_UNAUTHORIZED,
                SOCKET_ERROR_CODE.UNAUTHORIZED,
                "First message must be of type 'auth'.",
            );
            throw new AuthFailed("first message was not 'auth'");
        }

        const claims = await verifyToken(parsed.token);
        if (!claims?.sub) {
            this.failHandshake(
                WS_CLOSE_UNAUTHORIZED,
                SOCKET_ERROR_CODE.UNAUTHORIZED,
                "Invalid token.",
            );
            throw new AuthFailed("invalid token");
        }

        const supabaseUserId = claims.sub;
        const email = claims.email ?? null;
        const phone = claims.phone ?? null;

        let user: User | null =
            await SocketDbService.findUserBySupabaseId(supabaseUserId);
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
                SOCKET_ERROR_CODE.UNAUTHORIZED,
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
        this.send({ type: MESSAGE_TYPE.CONNECTED, userId: user.id });
        return this._user;
    }

    send(msg: ServerMessage): void {
        if (this.ws.readyState !== this.ws.OPEN) return;
        try {
            this.ws.send(JSON.stringify(msg));
        } catch {}
    }

    onMessage(handler: (msg: ClientMessageT) => void | Promise<void>): void {
        this.ws.on("message", async (data) => {
            let parsed: ClientMessageT;
            try {
                parsed = ClientMessage.parse(JSON.parse(data.toString()));
            } catch (err) {
                this.send({
                    type: MESSAGE_TYPE.ERROR,
                    code: SOCKET_ERROR_CODE.INVALID_PAYLOAD,
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
        errorCode: SOCKET_ERROR_CODE,
        message: string,
    ): never {
        if (this.ws.readyState === this.ws.OPEN) {
            try {
                this.ws.send(
                    JSON.stringify({
                        type: MESSAGE_TYPE.ERROR,
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
