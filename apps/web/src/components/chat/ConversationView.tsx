"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { chatApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import type { ChatMessage } from "@/src/lib/api";
import { useMeStore } from "@/src/store/useMeStore";
import type { ChatSocket } from "@/src/hooks/useChatSocket";
import { cn } from "@/src/lib/utils";

export function ConversationView({
    conversationId,
    socket,
}: {
    conversationId: string;
    socket: ChatSocket;
}) {
    const meId = useMeStore((s) => s.me?.id ?? null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // Load history whenever the active conversation changes.
    useEffect(() => {
        let cancelled = false;
        chatApi
            .list_messages(conversationId, { limit: 50 })
            .then((rows) => {
                if (cancelled) return;
                // Backend returns newest-first; we render oldest-first.
                setMessages([...rows].reverse());
                setError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn’t load messages.",
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    // Subscribe to inbound real-time messages.
    useEffect(() => {
        const off = socket.addListener((msg) => {
            if (msg.type !== "message_created") return;
            if (msg.message.conversationId !== conversationId) return;
            setMessages((prev) =>
                prev.some((m) => m.id === msg.message.id)
                    ? prev
                    : [...prev, msg.message],
            );
        });
        return off;
    }, [socket, conversationId]);

    // Auto-scroll to the bottom on new messages.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const canSend = useMemo(
        () => draft.trim().length > 0 && socket.status === "open",
        [draft, socket.status],
    );

    function handleSend() {
        const body = draft.trim();
        if (!body) return;
        socket.send({ type: "send_message", conversationId, body });
        setDraft("");
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-neutral-50"
            >
                {loading && messages.length === 0 && (
                    <div className="text-center text-[12px] text-muted-foreground py-8">
                        Loading messages…
                    </div>
                )}
                {error && (
                    <div className="text-center text-[12.5px] text-destructive py-2">
                        {error}
                    </div>
                )}
                {!loading && !error && messages.length === 0 && (
                    <div className="text-center text-[12.5px] text-muted-foreground py-8">
                        No messages yet. Say hi.
                    </div>
                )}
                {messages.map((m) => (
                    <Bubble key={m.id} message={m} ownId={meId} />
                ))}
            </div>

            <div className="border-t border-border bg-white px-3 py-2.5">
                <div className="flex items-end gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={
                            socket.status === "open"
                                ? "Type a message…"
                                : "Connecting…"
                        }
                        rows={1}
                        className={cn(
                            "flex-1 resize-none rounded-lg border border-input bg-white",
                            "px-3 py-2 text-[13px] placeholder:text-muted-foreground/70",
                            "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
                            "max-h-32",
                        )}
                    />
                    <Button
                        type="button"
                        variant="exec-dark"
                        disabled={!canSend}
                        onClick={handleSend}
                        className="h-9 px-3 cursor-pointer"
                    >
                        <SendHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Bubble({
    message,
    ownId,
}: {
    message: ChatMessage;
    ownId: string | null;
}) {
    const isMine = message.senderId === ownId;
    return (
        <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[78%] rounded-2xl px-3 py-1.5",
                    "text-[13px] whitespace-pre-wrap wrap-break-word",
                    isMine
                        ? "bg-foreground text-background rounded-br-sm"
                        : "bg-white border border-border rounded-bl-sm",
                )}
            >
                {message.body}
                <div
                    className={cn(
                        "mt-0.5 text-[10px]",
                        isMine ? "text-background/60" : "text-muted-foreground",
                    )}
                >
                    {new Date(message.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
        </div>
    );
}
