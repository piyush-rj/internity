"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    PiBriefcaseFill,
    PiBuildingsFill,
    PiCheckCircleFill,
    PiInfo,
    PiUsersFill,
} from "react-icons/pi";
import { BellIcon } from "@/src/components/dashboard/icons";
import { useNotifications } from "@/src/hooks/useNotifications";
import { type AppNotification, type NotificationType } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export function NotificationPanel() {
    const [open, setOpen] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { items, unread, loading, markRead, markAllRead } =
        useNotifications();

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                aria-label={
                    unread > 0
                        ? `Notifications, ${unread} unread`
                        : "Notifications"
                }
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "relative h-9 w-9 inline-flex items-center justify-center",
                    "rounded-md cursor-pointer",
                    "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    "transition-colors",
                )}
            >
                <BellIcon className="h-4 w-4" />
                {unread > 0 && (
                    <span
                        className={cn(
                            "absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 inline-flex items-center justify-center",
                            "rounded-full bg-orange-500 text-white text-[10px] font-semibold leading-none",
                            "ring-2 ring-card",
                        )}
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className={cn(
                        "absolute right-2 top-[calc(100%+3px)] z-40 w-80",
                        "rounded-lg border border-border bg-card shadow-lg overflow-hidden",
                    )}
                >
                    <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                        <div className="text-[13px] font-semibold">
                            Notifications
                        </div>
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-[11.5px] font-medium text-orange-600 hover:underline cursor-pointer"
                            >
                                Mark all read
                            </button>
                        )}
                    </header>

                    {loading && items.length === 0 ? (
                        <div className="px-4 py-6 text-[12.5px] text-muted-foreground text-center">
                            Loading…
                        </div>
                    ) : items.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <p className="text-[13px] font-medium text-foreground">
                                You’re all caught up
                            </p>
                            <p className="pt-1 text-[12px] text-muted-foreground">
                                New updates will show up here.
                            </p>
                        </div>
                    ) : (
                        <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                            {items.map((n) => (
                                <NotificationRow
                                    key={n.id}
                                    n={n}
                                    onActivate={() => {
                                        if (!n.readAt) markRead(n.id);
                                        setOpen(false);
                                    }}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

function NotificationRow({
    n,
    onActivate,
}: {
    n: AppNotification;
    onActivate: () => void;
}) {
    const body = (
        <div className="flex items-start gap-2.5">
            <span
                className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                    "bg-secondary text-foreground/70 ring-1 ring-border",
                )}
            >
                <NotificationIcon type={n.type} className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                    <p
                        className={cn(
                            "text-[12.5px] leading-snug min-w-0 flex-1",
                            n.readAt
                                ? "text-muted-foreground"
                                : "text-foreground font-medium",
                        )}
                    >
                        {n.title}
                    </p>
                    {!n.readAt && (
                        <span
                            aria-label="unread"
                            className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0"
                        />
                    )}
                </div>
                {n.body && (
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                        {n.body}
                    </p>
                )}
                <p className="mt-1 text-[10.5px] text-muted-foreground tabular-nums">
                    {timeAgo(n.createdAt)}
                </p>
            </div>
        </div>
    );

    return (
        <li>
            {n.link ? (
                <Link
                    href={n.link}
                    onClick={onActivate}
                    className={cn(
                        "block px-3.5 py-2.5 hover:bg-secondary/60 transition-colors",
                        !n.readAt && "bg-orange-50/40",
                    )}
                >
                    {body}
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={onActivate}
                    className={cn(
                        "block w-full text-left px-3.5 py-2.5 hover:bg-secondary/60 transition-colors cursor-pointer",
                        !n.readAt && "bg-orange-50/40",
                    )}
                >
                    {body}
                </button>
            )}
        </li>
    );
}

function NotificationIcon({
    type,
    className,
}: {
    type: NotificationType;
    className?: string;
}) {
    switch (type) {
        case "APPLICATION_RECEIVED":
            return <PiUsersFill className={className} />;
        case "APPLICATION_STATUS_CHANGED":
            return <PiCheckCircleFill className={className} />;
        case "APPLICATION_WITHDRAWN":
            return <PiBriefcaseFill className={className} />;
        case "LISTING_CLOSED":
        case "LISTING_TAKEN_DOWN":
        case "LISTING_RESTORED":
            return <PiBriefcaseFill className={className} />;
        case "COMPANY_MEMBER_ADDED":
        case "COMPANY_APPROVED":
        case "COMPANY_REJECTED":
            return <PiBuildingsFill className={className} />;
        default:
            return <PiInfo className={className} />;
    }
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
}
