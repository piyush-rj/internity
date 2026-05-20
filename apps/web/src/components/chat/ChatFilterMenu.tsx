"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CheckCheck, MailOpen, MessageCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

export type ChatFilter = "all" | "unread";

/**
 * The "All ⌄" chip + dropdown in the chat sidebar header. Stays
 * presentational — the parent owns filter state and the mark-all-read
 * handler.
 */
export function ChatFilterMenu({
    filter,
    onFilterChange,
    onMarkAllRead,
    hasUnread,
}: {
    filter: ChatFilter;
    onFilterChange: (f: ChatFilter) => void;
    onMarkAllRead: () => void;
    hasUnread: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDocClick(e: MouseEvent) {
            if (!ref.current || !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    const label = filter === "unread" ? "Unread" : "All";

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "inline-flex items-center gap-1 h-7 px-2.5 rounded-full",
                    "border border-border bg-white text-[12px] font-medium",
                    "hover:bg-secondary/60 transition-colors cursor-pointer",
                )}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                {label}
                <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {open && (
                <div
                    role="menu"
                    className={cn(
                        "absolute right-0 top-[calc(100%+6px)] z-30 w-44",
                        "rounded-lg border border-border bg-card shadow-lg overflow-hidden",
                    )}
                >
                    <MenuItem
                        icon={<MessageCircle className="h-3.5 w-3.5" />}
                        label="All"
                        active={filter === "all"}
                        onClick={() => {
                            onFilterChange("all");
                            setOpen(false);
                        }}
                    />
                    <MenuItem
                        icon={<MailOpen className="h-3.5 w-3.5" />}
                        label="Unread"
                        active={filter === "unread"}
                        onClick={() => {
                            onFilterChange("unread");
                            setOpen(false);
                        }}
                    />
                    <div className="my-0.5 border-t border-border" />
                    <MenuItem
                        icon={<CheckCheck className="h-3.5 w-3.5" />}
                        label="Mark all as read"
                        disabled={!hasUnread}
                        onClick={() => {
                            onMarkAllRead();
                            setOpen(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon,
    label,
    active,
    disabled,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            role="menuitem"
            className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px]",
                "transition-colors text-left",
                disabled
                    ? "text-muted-foreground/60 cursor-not-allowed"
                    : "text-foreground hover:bg-secondary/60 cursor-pointer",
                active && !disabled && "bg-secondary/40 font-medium",
            )}
        >
            <span className="text-muted-foreground">{icon}</span>
            <span>{label}</span>
        </button>
    );
}
