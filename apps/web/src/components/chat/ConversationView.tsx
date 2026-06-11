"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";
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
    isAdminView = false,
}: {
    conversationId: string;
    conversation: ConversationListItem | null;
    socket: ChatSocket;
    onBack?: () => void;
    isAdminView?: boolean;
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
    // Non-null while the user is editing one of their own sent messages.
    const [editing, setEditing] = useState<{
        id: string;
        originalBody: string;
    } | null>(null);
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

    // Switching threads abandons any in-progress edit so a draft never leaks
    // across conversations. Adjusted during render (not in an effect) to match
    // the peer-read sync above and avoid a cascading re-render.
    const [editConvId, setEditConvId] = useState(conversationId);
    if (editConvId !== conversationId) {
        setEditConvId(conversationId);
        setEditing(null);
        setDraft("");
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
            } else if (msg.type === MESSAGE_TYPE.MESSAGE_UPDATED) {
                if (msg.message.conversationId !== conversationId) return;
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === msg.message.id ? { ...m, ...msg.message } : m,
                    ),
                );
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
        if (editing) {
            // Skip the round-trip if nothing actually changed.
            if (trimmedDraft !== editing.originalBody.trim()) {
                const editedId = editing.id;
                socket.send({
                    type: MESSAGE_TYPE.EDIT_MESSAGE,
                    conversationId,
                    messageId: editedId,
                    body: trimmedDraft,
                });
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === editedId
                            ? {
                                  ...m,
                                  body: trimmedDraft,
                                  editedAt: new Date().toISOString(),
                              }
                            : m,
                    ),
                );
            }
            setEditing(null);
            setDraft("");
            return;
        }
        const clientId = makeClientId();
        const optimistic: Bubble = {
            id: clientId,
            clientId,
            conversationId,
            senderId: meId,
            body: trimmedDraft,
            createdAt: new Date().toISOString(),
            editedAt: null,
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

    // Only own, server-acknowledged (non-optimistic) messages are editable.
    function handleStartEdit(message: Bubble) {
        if (message.clientId || message.senderId !== meId) return;
        setEditing({ id: message.id, originalBody: message.body });
        setDraft(message.body);
    }

    function handleCancelEdit() {
        setEditing(null);
        setDraft("");
    }

    const groups = useMemo(() => groupByDay(messages), [messages]);
    const peerReadDate = useMemo(
        () => (peerReadAt ? new Date(peerReadAt) : null),
        [peerReadAt],
    );

    // In an admin's view of a support thread there can be several admins
    // sending into one shared thread (e.g. the main admin + the support
    // agent). The thread has exactly one non-admin participant (the peer), so
    // "ours" is anything the peer didn't send — otherwise another admin's
    // replies would render as if the user sent them.
    const isAdminThreadView =
        (isAdminView || meRole === "ADMIN") &&
        (conversation?.isAdminThread ?? false);
    const peerUserId = peer?.id ?? null;
    const ownForMessage = (senderId: string): boolean | undefined =>
        isAdminThreadView && peerUserId ? senderId !== peerUserId : undefined;

    const viewProfileHref =
        meRole === "EMPLOYER" && peer && !peerDeleted
            ? `/student/${peer.id}`
            : null;

    const headerContextSubtitle =
        !isAdminView && meRole !== "ADMIN"
            ? buildPeerSubtitle({
                  listingTitle: conversation?.listingTitle ?? null,
                  companyName: conversation?.companyName ?? null,
                  otherRolesCount: conversation?.otherRolesCount ?? 0,
              })
            : null;

    return (
        <div className="flex flex-col h-full min-h-0 bg-neutral-50">
            <ConversationHeader
                peer={peer}
                onBack={onBack}
                contextSubtitle={headerContextSubtitle}
            />

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <PeerProfileCard
                    peer={peer}
                    subtitle={buildPeerSubtitle({
                        listingTitle: conversation?.listingTitle ?? null,
                        companyName: conversation?.companyName ?? null,
                        otherRolesCount: conversation?.otherRolesCount ?? 0,
                    })}
                    viewProfileHref={viewProfileHref}
                    isAdminView={isAdminView || meRole === "ADMIN"}
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
                                    isOwn={ownForMessage(m.senderId)}
                                    peerReadDate={peerReadDate}
                                    onStartEdit={
                                        peerDeleted
                                            ? undefined
                                            : handleStartEdit
                                    }
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

            {!isAdminView && !peerDeleted && !editing && meRole && (
                <SuggestedReplies
                    meRole={meRole}
                    isAdminThread={conversation?.isAdminThread ?? false}
                    peerRole={conversation?.peerRole ?? null}
                    onSelect={(text: string) => setDraft(text)}
                />
            )}

            {isAdminView ? (
                <div className="px-5 py-3 border-t border-neutral-200 bg-zinc-50 text-[12px] text-muted-foreground text-center">
                    Read-only view — admins cannot send messages in support threads.
                </div>
            ) : (
                <Composer
                    draft={draft}
                    onDraftChange={setDraft}
                    onSend={handleSend}
                    canSend={canSend}
                    connecting={socket.status !== "open"}
                    disabledReason={
                        peerDeleted ? "This person deleted their account" : null
                    }
                    editing={!!editing}
                    onCancelEdit={handleCancelEdit}
                />
            )}
        </div>
    );
}

// key = `${myRole}_${peerRole}` e.g. "STUDENT_EMPLOYER", "ADMIN_STUDENT"
const SUGGESTIONS: Record<string, string[]> = {
    STUDENT_EMPLOYER: [
        "Thanks for reaching out! I'm really interested.",
        "Could you tell me more about the day-to-day responsibilities?",
        "I'd love to learn more about the team culture.",
        "When can we schedule a call to discuss further?",
    ],
    STUDENT_ADMIN: [
        "Hi! I need some help with my application.",
        "I'm having trouble with my profile setup.",
        "Could you help me find the right internship?",
    ],
    EMPLOYER_STUDENT: [
        "Thanks for applying! Your profile looks impressive.",
        "We'd like to schedule a quick interview with you.",
        "Could you walk us through a recent project you worked on?",
        "What's your availability for a quick intro call?",
    ],
    EMPLOYER_ADMIN: [
        "Hi! I need help setting up our company listing.",
        "I'm having trouble reviewing incoming applications.",
        "Could you help us find the right candidates?",
    ],
    ADMIN_STUDENT: [
        "Hi! How can we help you today?",
        "Thanks for reaching out. Could you share more details?",
        "We'll look into this and get back to you shortly.",
        "Your issue has been noted — we're on it!",
    ],
    ADMIN_EMPLOYER: [
        "Hi! How can we assist you today?",
        "Thanks for reaching out. What seems to be the issue?",
        "We'll prioritise this and follow up with you soon.",
        "Could you provide more details about your listing?",
    ],
};

function resolveSuggestionKey(
    meRole: string,
    isAdminThread: boolean,
    peerRole: string | null,
): string {
    if (isAdminThread) {
        if (meRole === "ADMIN") {
            // admin viewing a user's support thread — peerRole tells us who they are
            const peer = peerRole === "EMPLOYER" ? "EMPLOYER" : "STUDENT";
            return `ADMIN_${peer}`;
        }
        // non-admin talking to SpiderSkill
        return `${meRole}_ADMIN`;
    }
    // regular student <-> employer thread
    if (meRole === "STUDENT") return "STUDENT_EMPLOYER";
    if (meRole === "EMPLOYER") return "EMPLOYER_STUDENT";
    return "";
}

function SuggestedReplies({
    meRole,
    isAdminThread,
    peerRole,
    onSelect,
}: {
    meRole: string;
    isAdminThread: boolean;
    peerRole: string | null;
    onSelect: (text: string) => void;
}) {
    const [dismissed, setDismissed] = useState(false);
    const key = resolveSuggestionKey(meRole, isAdminThread, peerRole);
    const items = SUGGESTIONS[key] ?? [];
    if (items.length === 0 || dismissed) return null;

    return (
        <div className="px-3 pt-2 pb-1.5 border-t border-neutral-200 bg-white shrink-0">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                    <span className="text-orange-500 text-[11px]">✦</span>
                    <span className="text-[11px] font-semibold text-orange-500">
                        Suggested replies
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss suggested replies"
                    className="h-5 w-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors cursor-pointer"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {items.map((text) => (
                    <button
                        key={text}
                        type="button"
                        onClick={() => onSelect(text)}
                        className={cn(
                            "shrink-0 whitespace-nowrap",
                            "h-8 px-3 rounded-full border border-orange-300",
                            "text-[12px] text-foreground/80",
                            "hover:bg-orange-50 hover:border-orange-400 hover:text-foreground",
                            "transition-colors cursor-pointer",
                        )}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
