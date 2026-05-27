"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Plus } from "lucide-react";
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
}: {
    draft: string;
    onDraftChange: (v: string) => void;
    onSend: () => void;
    canSend: boolean;
    connecting: boolean;
    disabledReason?: string | null;
}) {
    const taRef = useRef<HTMLTextAreaElement>(null);
    const hasText = draft.trim().length > 0;

    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [draft]);

    return (
        <div className="px-3 py-2.5 shrink-0 border-t border-neutral-200">
            <div className="flex items-end gap-2">
                <button
                    type="button"
                    aria-label="Attach file"
                    title="Attach (coming soon)"
                    className={cn(
                        "h-12 w-12 inline-flex items-center justify-center rounded-full shrink-0",
                        "text-foreground bg-[#eaeaea] transition-colors cursor-pointer",
                    )}
                >
                    <Plus className="h-5 w-5" />
                </button>

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
