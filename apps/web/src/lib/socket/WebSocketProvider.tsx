"use client";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createClient } from "@/src/lib/supabase/client";
import { ENV } from "@/src/config/config.env";
import {
    WSClient,
    buildSocketUrl,
    type WSStatus,
} from "@/src/lib/socket/client";
import { MESSAGE_TYPE, type ClientMessage, type ServerMessage } from "types";

export type ChatSocket = {
    status: WSStatus;

    send: (msg: Exclude<ClientMessage, { type: MESSAGE_TYPE.AUTH }>) => void;
    addListener: (listener: (msg: ServerMessage) => void) => () => void;
};

const Ctx = createContext<ChatSocket | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<WSStatus>("connecting");
    const clientRef = useRef<WSClient | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const client = new WSClient({
            url: buildSocketUrl(ENV.NEXT_PUBLIC_BACKEND_URL, "/api/v1/chat/ws"),
            getToken: async () => {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                return session?.access_token ?? null;
            },
            onStatus: setStatus,
        });
        clientRef.current = client;
        return () => {
            client.close();
            clientRef.current = null;
        };
    }, []);

    const value = useMemo<ChatSocket>(
        () => ({
            status,
            send: (msg) => clientRef.current?.send(msg),
            addListener: (listener) => {
                const c = clientRef.current;
                if (!c) return () => {};
                return c.addListener(listener);
            },
        }),
        [status],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWebSocket(): ChatSocket {
    const ctx = useContext(Ctx);
    if (!ctx) {
        throw new Error(
            "useWebSocket must be used inside <WebSocketProvider>.",
        );
    }
    return ctx;
}
