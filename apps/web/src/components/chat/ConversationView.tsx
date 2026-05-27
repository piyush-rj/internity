"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chatApi, type ConversationListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { MESSAGE_TYPE } from "types";
import { useMeStore } from "@/src/store/useMeStore";
import { useChatStore } from "@/src/store/useChatStore";
import type { ChatSocket } from "@/src/hooks/useWebSocket";
import { Composer } from "./Composer";
import { ConversationHeader } from "./ConversationHeader";
import { DayDivider } from "./DayDivider";
import { MessageBubble } from "./MessageBubble";
import { MessagesSkeleton } from "./MessagesSkeleton";
import { PeerProfileCard, buildPeerSubtitle } from "./PeerProfileCard";
import {
    groupByDay,
    makeClientId,
    mergeIncoming,
    type Bubble,
} from "./chat-utils";

// right-pane chat view for a single conversation
export function ConversationView({
    conversationId,
    conversation,
    socket,
    onBack,
}: {
    conversationId: string;
    conversation: ConversationListItem | null;
    socket: ChatSocket;
    onBack?: () => void;
}) {
    const meId = useMeStore((s) => s.me?.id ?? null);
    const meRole = useMeStore((s) => s.me?.role ?? null);
    const clearUnread = useChatStore((s) => s.clearUnread);

    const peer = conversation?.peer ?? null;
    const peerLastReadAt = conversation?.peerLastReadAt ?? null;

    const [messages, setMessages] = useState<Bubble[]>([]);
    const [loadedConvId, setLoadedConvId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [peerReadAt, setPeerReadAt] = useState<string | null>(peerLastReadAt);
    const [peerReadSync, setPeerReadSync] = useState({
        conversationId,
        peerLastReadAt,
    });
    const scrollRef = useRef<HTMLDivElement | null>(null);

    if (
        peerReadSync.conversationId !== conversationId ||
        peerReadSync.peerLastReadAt !== peerLastReadAt
    ) {
        setPeerReadSync({ conversationId, peerLastReadAt });
        setPeerReadAt(peerLastReadAt);
    }

    const loading = loadedConvId !== conversationId;

    useEffect(() => {
        let cancelled = false;
        chatApi
            .list_messages(conversationId, { limit: 50 })
            .then((rows) => {
                if (cancelled) return;
                setMessages([...rows].reverse());
                setError(null);
                setLoadedConvId(conversationId);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn’t load messages.",
                );
                setLoadedConvId(conversationId);
            });
        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    useEffect(() => {
        return socket.addListener((msg) => {
            if (msg.type === MESSAGE_TYPE.MESSAGE_CREATED) {
                if (msg.message.conversationId !== conversationId) return;
                setMessages((prev) =>
                    mergeIncoming(prev, msg.message, msg.clientId),
                );
                if (msg.message.senderId !== meId) {
                    clearUnread(conversationId);
                    chatApi.mark_read(conversationId).catch(() => {});
                }
            } else if (msg.type === MESSAGE_TYPE.CONVERSATION_READ) {
                if (msg.conversationId !== conversationId) return;
                if (meId && msg.readerId === meId) return;
                setPeerReadAt(msg.readAt);
            }
        });
    }, [socket, conversationId, meId, clearUnread]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const peerDeleted = !!peer?.deletedAt;
    const trimmedDraft = draft.trim();
    const canSend =
        trimmedDraft.length > 0 &&
        socket.status === "open" &&
        !!meId &&
        !peerDeleted;

    function handleSend() {
        if (!canSend || !meId) return;
        const clientId = makeClientId();
        const optimistic: Bubble = {
            id: clientId,
            clientId,
            conversationId,
            senderId: meId,
            body: trimmedDraft,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setDraft("");
        socket.send({
            type: MESSAGE_TYPE.SEND_MESSAGE,
            clientId,
            conversationId,
            body: trimmedDraft,
        });
    }

    const groups = useMemo(() => groupByDay(messages), [messages]);
    const peerReadDate = useMemo(
        () => (peerReadAt ? new Date(peerReadAt) : null),
        [peerReadAt],
    );

    const viewProfileHref =
        meRole === "EMPLOYER" && peer && !peerDeleted
            ? `/student/${peer.id}`
            : null;

    return (
        <div className="flex flex-col h-full min-h-0 bg-neutral-50">
            <ConversationHeader peer={peer} onBack={onBack} />

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <PeerProfileCard
                    peer={peer}
                    subtitle={buildPeerSubtitle({
                        peerEmail: peer?.email ?? null,
                        listingTitle: conversation?.listingTitle ?? null,
                        companyName: conversation?.companyName ?? null,
                        otherRolesCount: conversation?.otherRolesCount ?? 0,
                        viewerRole: meRole,
                    })}
                    viewProfileHref={viewProfileHref}
                />

                <div className="px-5 pb-4">
                    {loading && messages.length === 0 && <MessagesSkeleton />}
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

                    {groups.map((group) => (
                        <section
                            key={group.dayKey}
                            className="relative space-y-1.5"
                        >
                            <DayDivider label={group.label} />
                            {group.messages.map((m) => (
                                <MessageBubble
                                    key={m.clientId ?? m.id}
                                    message={m}
                                    ownId={meId}
                                    peerReadDate={peerReadDate}
                                />
                            ))}
                        </section>
                    ))}
                </div>
            </div>

            {peerDeleted && (
                <div className="px-5 py-2 border-t border-neutral-200 bg-zinc-50 text-[12px] text-muted-foreground text-center">
                    This person deleted their account. You can&rsquo;t send any
                    new messages in this thread.
                </div>
            )}

            <Composer
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
                canSend={canSend}
                connecting={socket.status !== "open"}
                disabledReason={
                    peerDeleted ? "This person deleted their account" : null
                }
            />
        </div>
    );
}
