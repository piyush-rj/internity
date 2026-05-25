"use client";

import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from "react-icons/io5";
import { cn } from "@/src/lib/utils";
import { formatTime, type Bubble } from "./chat-utils";

// single message bubble row with time and read tick
export function MessageBubble({
    message,
    ownId,
    peerReadDate,
}: {
    message: Bubble;
    ownId: string | null;
    peerReadDate: Date | null;
}) {
    const isMine = message.senderId === ownId;
    const pending = !!message.clientId;
    const createdAt = new Date(message.createdAt);
    const readByPeer =
        isMine &&
        !pending &&
        peerReadDate !== null &&
        createdAt.getTime() <= peerReadDate.getTime();

    return (
        <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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
                    <span className="flex-1">{message.body}</span>
                    <div
                        className={cn(
                            "shrink-0 flex items-center gap-1.5 text-[10px] tabular-nums",
                            isMine ? "text-white" : "text-muted-foreground",
                        )}
                    >
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
