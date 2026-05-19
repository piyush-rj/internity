"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { ENV } from "@/src/config/config.env";
import { CustomWS, buildChatSocketUrl } from "@/src/lib/ws/chat-socket";
import type {
    ClientMessage,
    ServerMessage,
} from "@/src/lib/ws/chat-types";

type Status = "idle" | "connecting" | "open" | "closed";

export type ChatSocket = {
    status: Status;
    /** Send a chat message. No-op when the socket isn't open yet. */
    send: (msg: Exclude<ClientMessage, { type: "auth" }>) => void;
    /** Subscribe to inbound messages — returns an unsubscribe function. */
    addListener: (listener: (msg: ServerMessage) => void) => () => void;
};

/**
 * Single chat WebSocket scoped to the currently signed-in user.
 *
 * Holds one persistent connection for the lifetime of the calling component.
 * The auth token is fetched from Supabase right before connect; we make no
 * effort to rotate mid-session — if the token expires the server closes the
 * socket with 4401 and the next page load re-mounts the hook with a fresh
 * token.
 */
export function useChatSocket(): ChatSocket {
    const [status, setStatus] = useState<Status>("idle");
    const socketRef = useRef<CustomWS | null>(null);
    const listenersRef = useRef<Set<(msg: ServerMessage) => void>>(new Set());

    useEffect(() => {
        let cancelled = false;

        async function connect() {
            const supabase = createClient();
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token || cancelled) return;

            setStatus("connecting");

            const ws = new CustomWS({
                url: buildChatSocketUrl(ENV.NEXT_PUBLIC_BACKEND_URL),
                token,
                onReady: () => {
                    if (cancelled) return;
                    setStatus("open");
                },
                onMessage: (msg) => {
                    for (const l of listenersRef.current) l(msg);
                },
                onClose: () => {
                    if (cancelled) return;
                    setStatus("closed");
                },
            });

            socketRef.current = ws;
        }

        connect();

        return () => {
            cancelled = true;
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, []);

    return {
        status,
        send: (msg) => socketRef.current?.send(msg),
        addListener: (listener) => {
            listenersRef.current.add(listener);
            return () => {
                listenersRef.current.delete(listener);
            };
        },
    };
}
