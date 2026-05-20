import type { CustomWS } from "./socket.custom.ts";
import type { ServerMessage } from "types";

class ConnectionManager {
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

export const manager = new ConnectionManager();
