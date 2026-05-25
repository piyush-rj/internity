"use client";
import { memo, useCallback, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openCheckout } from "@/src/lib/razorpay";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";
import {
    ChevronRightIcon,
    SparklesIcon,
} from "@/src/components/dashboard/icons";
import {
    PiBookmarkSimpleFill,
    PiBriefcaseFill,
    PiBuildingsFill,
    PiChatCircleFill,
    PiFileTextFill,
    PiGearFill,
    PiHouseFill,
    PiUserFill,
    PiUsersFill,
} from "react-icons/pi";
import { GiTie } from "react-icons/gi";
import type { UserRole } from "@/src/lib/api";
import { useMeStore } from "@/src/store/useMeStore";
import { selectTotalUnread, useChatStore } from "@/src/store/useChatStore";

type IconComp = ComponentType<{ className?: string }>;

type Item = {
    key: string;
    label: string;
    icon: IconComp;
    href: string;
    badge?: string;
    /** "primary" badges pop visually — use for live counts like unread chats. */
    badgeIntent?: "muted" | "primary";
};

type NavSet = { workspace: Item[]; profile: Item[] };

const studentNav: NavSet = {
    workspace: [
        {
            key: "dashboard",
            label: "Dashboard",
            icon: PiHouseFill,
            href: "/home",
        },
        {
            key: "internships",
            label: "Internships",
            icon: PiBriefcaseFill,
            href: "/home/internships",
        },
        {
            key: "jobs",
            label: "Jobs",
            icon: PiBuildingsFill,
            href: "/home/jobs",
        },
        {
            key: "applications",
            label: "Applications",
            icon: PiFileTextFill,
            href: "/home/applications",
        },
        {
            key: "saved",
            label: "Saved",
            icon: PiBookmarkSimpleFill,
            href: "/home/saved",
        },
        {
            key: "messages",
            label: "Messages",
            icon: PiChatCircleFill,
            href: "/home/messages",
        },
    ],
    profile: [
        {
            key: "resume",
            label: "Resume",
            icon: PiFileTextFill,
            href: "/home/resume",
        },
        {
            key: "profile",
            label: "Profile",
            icon: PiUserFill,
            href: "/home/profile",
        },
        {
            key: "settings",
            label: "Settings",
            icon: PiGearFill,
            href: "/home/settings",
        },
    ],
};

const employerNav: NavSet = {
    workspace: [
        {
            key: "dashboard",
            label: "Dashboard",
            icon: PiHouseFill,
            href: "/home",
        },
        {
            key: "manage-listings",
            label: "My listings",
            icon: PiBriefcaseFill,
            href: "/home/manage-listings",
        },
        {
            key: "applicants",
            label: "Applicants",
            icon: PiUsersFill,
            href: "/home/applicants",
        },
        {
            key: "company",
            label: "Company",
            icon: PiBuildingsFill,
            href: "/home/company",
        },
        {
            key: "messages",
            label: "Messages",
            icon: PiChatCircleFill,
            href: "/home/messages",
        },
    ],
    profile: [
        {
            key: "profile",
            label: "Profile",
            icon: PiUserFill,
            href: "/home/profile",
        },
        {
            key: "settings",
            label: "Settings",
            icon: PiGearFill,
            href: "/home/settings",
        },
    ],
};

function pickNav(role: UserRole | null | undefined): NavSet {
    return role === "EMPLOYER" ? employerNav : studentNav;
}

function resolveActiveKey(pathname: string, nav: NavSet): string {
    const segment = pathname.split("/")[2] ?? "";
    const all = [...nav.workspace, ...nav.profile];
    const match = all.find((it) => it.key === segment);
    return match?.key ?? "dashboard";
}

export function Sidebar() {
    const pathname = usePathname() ?? "/home";
    const role = useMeStore((s) => s.me?.role);
    const totalUnread = useChatStore(selectTotalUnread);
    const nav = pickNav(role);
    const resolvedKey = resolveActiveKey(pathname, nav);

    // Optimistic highlight: when the user clicks a tab we paint the new
    // active row instantly while Next.js loads the route in the background.
    // Cleared once `pathname` catches up.
    const [pendingKey, setPendingKey] = useState<string | null>(null);
    if (pendingKey !== null && pendingKey === resolvedKey) {
        setPendingKey(null);
    }
    const activeKey = pendingKey ?? resolvedKey;

    const onNavClick = useCallback((key: string) => setPendingKey(key), []);

    // Inject the live unread count onto the Messages nav item.
    const decorate = useCallback(
        (item: Item): Item => {
            if (item.key !== "messages" || totalUnread <= 0) return item;
            return {
                ...item,
                badge: totalUnread > 99 ? "99+" : String(totalUnread),
                badgeIntent: "primary",
            };
        },
        [totalUnread],
    );

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col w-60 shrink-0",
                "sticky top-0 h-screen",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <Link
                href={"/"}
                className="flex items-center gap-2 px-5 h-13 border-b border-border cursor-pointer"
            >
                <div
                    className={cn(
                        "h-7.5 w-7.5 flex justify-center items-center bg-linear-to-b from-neutral-700 to-neutral-900 rounded-sm ",
                        "inset-shadow-xs inset-shadow-white/50 shadow-sm shadow-black/10",
                    )}
                >
                    <GiTie className="size-5 text-white" />
                </div>
                <div className="h-7.5 flex flex-col justify-between pt-px">
                    <span className="text-[15px] font-semibold tracking-normal leading-none">
                        SpiderSkill
                    </span>
                    <span className="text-[11px] text-black/50 leading-none">
                        Caffeine to carrier
                    </span>
                </div>
            </Link>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <SectionLabel>Workspace</SectionLabel>
                <div className="space-y-0.5">
                    {nav.workspace.map((item) => (
                        <NavItem
                            key={item.key}
                            item={decorate(item)}
                            active={item.key === activeKey}
                            onClick={onNavClick}
                        />
                    ))}
                </div>

                <SectionLabel className="mt-6">Profile</SectionLabel>
                <div className="space-y-0.5">
                    {nav.profile.map((item) => (
                        <NavItem
                            key={item.key}
                            item={decorate(item)}
                            active={item.key === activeKey}
                            onClick={onNavClick}
                        />
                    ))}
                </div>
            </nav>

            <UpgradeCard />
        </aside>
    );
}

function SectionLabel({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                className,
            )}
        >
            {children}
        </div>
    );
}

const NavItem = memo(function NavItem({
    item,
    active,
    onClick,
}: {
    item: Item;
    active: boolean;
    onClick: (key: string) => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            prefetch
            onClick={() => onClick(item.key)}
            className={cn(
                "flex items-center gap-3 rounded-sm px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                active
                    ? "bg-white ring-1 ring-black/9 shadow-sm shadow-black/4"
                    : "text-muted-foreground hover:text-foreground/80",
            )}
        >
            <Icon
                className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-orange-500" : "text-neutral-500",
                )}
            />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span
                    className={cn(
                        "min-w-4 h-4 inline-flex items-center justify-center px-1.5 text-[8.5px] font-semibold tabular-nums",
                        item.badgeIntent === "primary"
                            ? "rounded-full bg-orange-500 text-white"
                            : "rounded-md bg-muted text-muted-foreground",
                    )}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
});

function UpgradeCard() {
    const session = useUserSessionStore((s) => s.session);
    const isPremium = useMeStore((s) => s.me?.isPremium ?? false);
    const refetchMe = useMeStore((s) => s.refetch);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        if (busy) return;
        setError(null);
        setBusy(true);
        try {
            await openCheckout({
                planCode: "PRO",
                prefill: {
                    name: session?.user?.name ?? undefined,
                    email: session?.user?.email ?? undefined,
                },
                onSuccess: () => refetchMe(),
                onDismiss: () => setBusy(false),
                onFailure: (msg) => setError(msg),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-lg border border-border bg-card p-3 m-2">
            <div className="flex items-center gap-2 text-[12px] font-medium">
                <SparklesIcon className="text-orange-600 h-3.5 w-3.5" />
                <span>{isPremium ? "You're on Pro" : "Upgrade to Pro"}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                {isPremium
                    ? "Thanks for upgrading — enjoy unlimited applications, priority support, and mentor sessions."
                    : "Unlimited applications, priority support, and 1:1 mentor sessions."}
            </p>
            {!isPremium && (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={busy}
                    className={cn(
                        "mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-orange-600",
                        "hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                    )}
                >
                    {busy ? "Opening…" : "Buy Plan · ₹499"}
                    <ChevronRightIcon className="h-3 w-3" />
                </button>
            )}
            {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
        </div>
    );
}
