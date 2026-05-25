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

/**
 * Right-pane chat view for a single conversation. Owns message state +
 * read-pointer state for the active conversation; relies on the layout-wide
 * WS provider for the underlying socket.
 */
export function ConversationView({
    conversationId,
    conversation,
    socket,
}: {
    conversationId: string;
    /** Header + profile-card metadata; may be null while the list is loading. */
    conversation: ConversationListItem | null;
    socket: ChatSocket;
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

    // Reset the peer-read marker whenever we switch conversations or the
    // server-side last-read pointer moves. setState-during-render (instead of
    // an effect) avoids the cascading-render lint error.
    if (
        peerReadSync.conversationId !== conversationId ||
        peerReadSync.peerLastReadAt !== peerLastReadAt
    ) {
        setPeerReadSync({ conversationId, peerLastReadAt });
        setPeerReadAt(peerLastReadAt);
    }

    const loading = loadedConvId !== conversationId;

    // ----- load history when the conversation changes ------------------
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

    // ----- live updates over the socket --------------------------------
    useEffect(() => {
        return socket.addListener((msg) => {
            if (msg.type === MESSAGE_TYPE.MESSAGE_CREATED) {
                if (msg.message.conversationId !== conversationId) return;
                setMessages((prev) =>
                    mergeIncoming(prev, msg.message, msg.clientId),
                );
                // If we're viewing this conv and the new message came from
                // someone else, mark it read so the peer's tick flips.
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

    // Autoscroll to the bottom when the message list grows.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const trimmedDraft = draft.trim();
    const canSend =
        trimmedDraft.length > 0 && socket.status === "open" && !!meId;

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

    // Only employers have a public student profile to link to.
    const viewProfileHref =
        meRole === "EMPLOYER" && peer ? `/student/${peer.id}` : null;

    return (
        <div className="flex flex-col h-full min-h-0 bg-neutral-50">
            <ConversationHeader peer={peer} />

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

            <Composer
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
                canSend={canSend}
                connecting={socket.status !== "open"}
            />
        </div>
    );
}
