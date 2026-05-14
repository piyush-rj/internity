"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
    BookmarkIcon,
    BriefcaseIcon,
    FileTextIcon,
    HelpCircleIcon,
    HomeIcon,
    LogOutIcon,
    ShieldIcon,
    SlidersIcon,
} from "@/src/components/base/icons";
import { cn } from "@/src/lib/utils";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

const items = [
    { Icon: HomeIcon, label: "Home", href: "/dashboard" },
    { Icon: BriefcaseIcon, label: "My Applications", href: "/applications" },
    { Icon: BookmarkIcon, label: "My Bookmarks", href: "/bookmarks" },
    { Icon: FileTextIcon, label: "Edit Resume", href: "/resume" },
    { Icon: SlidersIcon, label: "Edit Preferences", href: "/preferences" },
    { Icon: ShieldIcon, label: "Safety Tips", href: "/safety" },
    { Icon: HelpCircleIcon, label: "Help Center", href: "/help" },
];

export function UserMenu() {
    const session = useUserSessionStore((s) => s.session);
    const [open, setOpen] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (!session?.user) return null;

    return (
        <div className="relative flex items-center" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    "relative h-8 w-8 rounded-full overflow-hidden",
                    "ring-1 ring-neutral-400 hover:ring-neutral-400 transition transform duration-200 cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-brand",
                )}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                {session.user.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name ?? "user"}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                ) : (
                    <span
                        className={cn(
                            "flex h-full w-full items-center justify-center",
                            "bg-muted",
                            "text-[13px] font-medium text-foreground",
                        )}
                    >
                        {(session.user.name ?? "U")[0]?.toUpperCase()}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    className={cn(
                        "absolute right-0 top-[calc(100%+3px)] w-65 z-50 origin-top-right",
                        "rounded-lg border border-border bg-white",
                        "py-1.5",
                        "shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]",
                    )}
                >
                    <div className="px-3 pt-2.5 pb-3 flex items-center gap-x-2">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-1 ring-black/20">
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name ?? "user"}
                                    className="object-cover"
                                    fill
                                    unoptimized
                                    loading="eager"
                                />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center bg-muted text-[13px] font-medium text-foreground">
                                    {(session.user.name ??
                                        "U")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[14px] font-semibold text-foreground truncate">
                                {session.user.name}
                            </div>
                            <div className="text-[12px] text-muted-foreground truncate">
                                {session.user.email}
                            </div>
                        </div>
                    </div>

                    <div className="mx-2 h-px bg-border" />

                    <div className="py-1">
                        {items.map(({ Icon, label, href }) => (
                            <a
                                key={label}
                                href={href}
                                role="menuitem"
                                className={cn(
                                    "mx-1.5 flex items-center gap-3 px-2.5 py-2",
                                    "rounded-md hover:bg-muted",
                                    "text-[12px] text-black/80",
                                    "transition-colors",
                                )}
                            >
                                <Icon className="h-4 w-4 text-black/75" />
                                {label}
                            </a>
                        ))}
                    </div>

                    <div className="mx-2 h-px bg-border" />

                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            signOut({ callbackUrl: "/" });
                        }}
                        role="menuitem"
                        className={cn(
                            "mx-1.5 my-1 flex w-[calc(100%-12px)] items-center gap-3 cursor-pointer",
                            "px-2.5 py-2",
                            "rounded-md hover:bg-muted",
                            "text-[12px] text-foreground",
                            "transition-colors",
                        )}
                    >
                        <LogOutIcon className="h-4 w-4 text-black/75" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
