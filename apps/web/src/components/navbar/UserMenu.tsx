"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { AddEmailDialog } from "@/src/components/auth/AddEmailDialog";
import {
    BookmarkIcon,
    BriefcaseIcon,
    HomeIcon,
    LogOutIcon,
    SlidersIcon,
    UserIcon,
} from "@/src/components/base/icons";
import { cn } from "@/src/lib/utils";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

const items = [
    { Icon: HomeIcon, label: "Dashboard", href: "/home/dashboard" },
    {
        Icon: BriefcaseIcon,
        label: "My applications",
        href: "/home/applications",
    },
    { Icon: BookmarkIcon, label: "Saved", href: "/home/saved" },
    { Icon: UserIcon, label: "Profile", href: "/home/profile" },
    { Icon: SlidersIcon, label: "Settings", href: "/home/settings" },
];

export function UserMenu() {
    const session = useUserSessionStore((s) => s.session);
    const me = useMeStore((s) => s.me);
    const router = useRouter();
    const supabase = createClient();
    const [open, setOpen] = useState<boolean>(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    async function handleSignOut() {
        setOpen(false);
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
    }

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

    // Prefer the app's own User row (me) — it has the persisted name/email
    // we collected during phone-OTP onboarding. Fall back to the Supabase
    // session metadata during the brief load window.
    const displayName = me?.name ?? session.user.name ?? null;
    const displayImage = me?.image ?? session.user.image ?? null;
    const displayEmail = me?.email ?? session.user.email ?? null;
    const phoneOnly = !displayEmail && (me?.phone ?? session.user.phone);
    const initial = (displayName ?? displayEmail ?? "U")[0]?.toUpperCase();

    return (
        <>
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
                    <AvatarBubble
                        image={displayImage}
                        initial={initial}
                        name={displayName}
                    />
                </button>

                {open && (
                    <div
                        role="menu"
                        className={cn(
                            "absolute right-0 top-[calc(100%+3px)] w-72 z-50 origin-top-right",
                            "rounded-lg border border-border bg-white",
                            "py-1.5",
                            "shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]",
                        )}
                    >
                        <div className="px-3 pt-2.5 pb-3 flex items-center gap-x-2.5">
                            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-1 ring-black/20">
                                <AvatarBubble
                                    image={displayImage}
                                    initial={initial}
                                    name={displayName}
                                />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="text-[14px] font-semibold text-foreground truncate">
                                    {displayName ?? "—"}
                                </div>
                                {displayEmail ? (
                                    <div className="text-[12px] text-muted-foreground truncate">
                                        {displayEmail}
                                    </div>
                                ) : phoneOnly ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            setEmailDialogOpen(true);
                                        }}
                                        className={cn(
                                            "inline-flex items-center gap-1 self-start",
                                            "text-[12px] font-medium text-brand",
                                            "hover:underline cursor-pointer",
                                        )}
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add an email address
                                    </button>
                                ) : (
                                    <div className="text-[12px] text-muted-foreground truncate">
                                        —
                                    </div>
                                )}
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
                            onClick={handleSignOut}
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

            <AddEmailDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
            />
        </>
    );
}

function AvatarBubble({
    image,
    initial,
    name,
}: {
    image: string | null;
    initial: string | undefined;
    name: string | null;
}) {
    if (image) {
        return (
            <Image
                src={image}
                alt={name ?? "user"}
                fill
                unoptimized
                className="object-cover"
            />
        );
    }
    return (
        <span
            className={cn(
                "flex h-full w-full items-center justify-center",
                "bg-linear-to-br from-pink-400 to-violet-500",
                "text-white text-[13px] font-semibold",
            )}
        >
            {initial ?? "U"}
        </span>
    );
}
