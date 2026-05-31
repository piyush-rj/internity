"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Pencil, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

const MAX_HEIGHT_PX = 140;

// bottom-of-thread chat composer with autogrow textarea
export function Composer({
    draft,
    onDraftChange,
    onSend,
    canSend,
    connecting,
    disabledReason = null,
    editing = false,
    onCancelEdit,
}: {
    draft: string;
    onDraftChange: (v: string) => void;
    onSend: () => void;
    canSend: boolean;
    connecting: boolean;
    disabledReason?: string | null;
    editing?: boolean;
    onCancelEdit?: () => void;
}) {
    const taRef = useRef<HTMLTextAreaElement>(null);
    const hasText = draft.trim().length > 0;

    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [draft]);

    // Pressing Escape while editing abandons the edit, matching the cancel
    // button. Send/blur are unaffected.
    useEffect(() => {
        if (!editing) return;
        const ta = taRef.current;
        if (!ta) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit?.();
            }
        }
        ta.addEventListener("keydown", onKey);
        return () => ta.removeEventListener("keydown", onKey);
    }, [editing, onCancelEdit]);

    return (
        <div className="px-3 py-2.5 shrink-0 border-t border-neutral-200">
            {editing && (
                <div className="flex items-center gap-2 mb-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 text-[12px] text-foreground">
                    <Pencil className="h-3 w-3 shrink-0 text-brand" />
                    <span className="flex-1 min-w-0 truncate font-medium">
                        Editing message
                    </span>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        aria-label="Cancel editing"
                        className="h-5 w-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            <div className="flex items-end gap-2">
                <div
                    className={cn(
                        "flex-1 min-w-0 flex items-center gap-1 pl-4 pr-1.5 py-2",
                        "rounded-3xl bg-[#eaeaea]",
                        "transition-colors",
                    )}
                >
                    <textarea
                        ref={taRef}
                        value={disabledReason ? "" : draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        placeholder={
                            disabledReason
                                ? disabledReason
                                : editing
                                  ? "Edit message"
                                  : connecting
                                    ? "Connecting…"
                                    : "Message"
                        }
                        disabled={!!disabledReason}
                        rows={1}
                        className={cn(
                            "flex-1 resize-none bg-transparent outline-none",
                            "text-[13px] leading-6 placeholder:text-muted-foreground",
                            "py-1 transition-all transform duration-200",
                            disabledReason && "cursor-not-allowed",
                        )}
                    />

                    {hasText && (
                        <button
                            type="button"
                            onClick={onSend}
                            disabled={!canSend}
                            aria-label="Send"
                            className={cn(
                                "h-7.5 w-7.5 inline-flex items-center justify-center rounded-full shrink-0 mr-0.75",
                                "bg-brand text-background hover:bg-orange-500",
                                "transition-colors duration-200 cursor-pointer",
                                "disabled:opacity-60 disabled:cursor-not-allowed",
                            )}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
