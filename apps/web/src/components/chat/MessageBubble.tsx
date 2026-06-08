"use client";

import { Pencil } from "lucide-react";
import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from "react-icons/io5";
import { cn } from "@/src/lib/utils";
import { formatTime, type Bubble } from "./chat-utils";

// single message bubble row with time and read tick
export function MessageBubble({
    message,
    ownId,
    peerReadDate,
    onStartEdit,
}: {
    message: Bubble;
    ownId: string | null;
    peerReadDate: Date | null;
    onStartEdit?: (message: Bubble) => void;
}) {
    const isMine = message.senderId === ownId;
    const pending = !!message.clientId;
    const createdAt = new Date(message.createdAt);
    const edited = !pending && !!message.editedAt;
    const withinEditWindow = Date.now() - createdAt.getTime() <= 60 * 60 * 1000;
    const canEdit = isMine && !pending && !!onStartEdit && withinEditWindow;
    const readByPeer =
        isMine &&
        !pending &&
        peerReadDate !== null &&
        createdAt.getTime() <= peerReadDate.getTime();

    return (
        <div
            className={cn(
                "group/msg flex items-center gap-1",
                isMine ? "justify-end" : "justify-start",
            )}
        >
            {canEdit && (
                <button
                    type="button"
                    onClick={() => onStartEdit?.(message)}
                    aria-label="Edit message"
                    title="Edit"
                    className={cn(
                        "shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-full",
                        "text-muted-foreground hover:text-foreground hover:bg-secondary",
                        "opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity cursor-pointer",
                    )}
                >
                    <Pencil className="h-3 w-3" />
                </button>
            )}
            <div
                className={cn(
                    "max-w-[78%] rounded-md px-3 py-1.5",
                    "text-[13px] whitespace-pre-wrap wrap-break-word",
                    isMine
                        ? "bg-brand text-white"
                        : "bg-white border border-border",
                )}
            >
                <div className="flex items-end gap-2.5">
                    <span className="flex-1">
                        <Linkified text={message.body} isMine={isMine} />
                    </span>
                    <div
                        className={cn(
                            "shrink-0 flex items-center gap-1.5 text-[10px] tabular-nums",
                            isMine ? "text-white" : "text-muted-foreground",
                        )}
                    >
                        {edited && (
                            <span
                                className={cn(
                                    "italic",
                                    isMine ? "opacity-75" : "opacity-80",
                                )}
                            >
                                edited
                            </span>
                        )}
                        <span className={isMine ? "opacity-85" : undefined}>
                            {formatTime(createdAt)}
                        </span>
                        {isMine && (
                            <ReadTick pending={pending} read={readByPeer} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReadTick({ pending, read }: { pending: boolean; read: boolean }) {
    const Icon =
        pending || !read ? IoCheckmarkCircleOutline : IoCheckmarkCircle;
    return <Icon className="h-3 w-3 shrink-0" />;
}

// http(s):// and www. URLs, stopping before trailing punctuation so a link
// at the end of a sentence doesn't swallow the period/paren.
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]}'"])/gi;

// Renders message text with any URLs turned into safe, clickable links.
// Everything else stays plain text so user input is never treated as markup.
function Linkified({ text, isMine }: { text: string; isMine: boolean }) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    // Fresh regex per render — RegExp with the `g` flag is stateful.
    const re = new RegExp(URL_RE.source, "gi");
    let key = 0;
    while ((match = re.exec(text)) !== null) {
        const raw = match[0];
        const start = match.index;
        if (start > lastIndex) {
            parts.push(text.slice(lastIndex, start));
        }
        const href = raw.startsWith("www.") ? `https://${raw}` : raw;
        parts.push(
            <a
                key={`l${key++}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={cn(
                    "underline underline-offset-2 break-all",
                    isMine ? "text-white" : "text-brand",
                )}
            >
                {raw}
            </a>,
        );
        lastIndex = start + raw.length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return <>{parts}</>;
}
