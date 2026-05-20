/**
 * In-memory registry of live chat sockets.
 *
 * One user can have multiple open sockets (multiple tabs, mobile + desktop).
 * Broadcasts iterate every socket for every target user; per-socket failures
 * are tolerated by `CustomWS.send` so one dead connection doesn't sink the rest.
 *
 * Fine for single-process dev. For horizontal scaling, swap the in-memory
 * dict for a Redis pub/sub fan-out — the public interface stays the same.
 */

import type { CustomWS } from "./socket.custom.ts";
import type { ServerMessage } from "../types/types.socket.ts";

class ConnectionManager {
    // userId -> set of live CustomWS instances
    private readonly sockets: Map<string, Set<CustomWS>> = new Map();

    register(userId: string, ws: CustomWS): void {
        let bucket = this.sockets.get(userId);
        if (!bucket) {
            bucket = new Set();
            this.sockets.set(userId, bucket);
        }
        bucket.add(ws);
    }

    unregister(userId: string, ws: CustomWS): void {
        const bucket = this.sockets.get(userId);
        if (!bucket) return;
        bucket.delete(ws);
        if (bucket.size === 0) this.sockets.delete(userId);
    }

    sendToUser(userId: string, msg: ServerMessage): void {
        const bucket = this.sockets.get(userId);
        if (!bucket) return;
        for (const ws of bucket) ws.send(msg);
    }

    sendToUsers(userIds: readonly string[], msg: ServerMessage): void {
        const seen = new Set<string>();
        for (const uid of userIds) {
            if (seen.has(uid)) continue;
            seen.add(uid);
            this.sendToUser(uid, msg);
        }
    }
}

/** Process-global singleton, lazy-imported by route handlers. */
export const manager = new ConnectionManager();
