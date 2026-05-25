import type { CustomWS } from "./socket.custom.ts";
import type { ServerMessage } from "types";

class ConnectionManager {
    private readonly sockets: Map<string, Set<CustomWS>> = new Map();

    // registers a socket and returns true if user just came online
    register(userId: string, ws: CustomWS): boolean {
        let bucket = this.sockets.get(userId);
        const wasOffline = !bucket || bucket.size === 0;
        if (!bucket) {
            bucket = new Set();
            this.sockets.set(userId, bucket);
        }
        bucket.add(ws);
        return wasOffline;
    }

    // unregisters a socket and returns true if user went offline
    unregister(userId: string, ws: CustomWS): boolean {
        const bucket = this.sockets.get(userId);
        if (!bucket) return false;
        bucket.delete(ws);
        if (bucket.size === 0) {
            this.sockets.delete(userId);
            return true;
        }
        return false;
    }

    isOnline(userId: string): boolean {
        const bucket = this.sockets.get(userId);
        return !!bucket && bucket.size > 0;
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
