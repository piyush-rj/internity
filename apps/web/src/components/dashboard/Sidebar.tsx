"use client";
import { memo, useCallback, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import {
    ChevronRightIcon,
    SparklesIcon,
} from "@/src/components/dashboard/icons";
import {
    PiBookmarkSimpleFill,
    PiBriefcaseFill,
    PiBuildingsFill,
    PiCalendarCheckFill,
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
        {
            key: "schedules",
            label: "Schedules",
            icon: PiCalendarCheckFill,
            href: "/home/schedules",
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
        {
            key: "schedules",
            label: "Schedules",
            icon: PiCalendarCheckFill,
            href: "/home/schedules",
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
    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col w-60 shrink-0",
                "sticky top-0 h-screen",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <SidebarBody />
        </aside>
    );
}

// inner sidebar shared by desktop aside and mobile drawer
export function SidebarBody({
    onNavigate,
}: {
    onNavigate?: () => void;
} = {}) {
    const pathname = usePathname() ?? "/home";
    const role = useMeStore((s) => s.me?.role);
    const initialized = useMeStore((s) => s.initialized);
    const totalUnread = useChatStore(selectTotalUnread);
    const nav = pickNav(role);
    const resolvedKey = resolveActiveKey(pathname, nav);

    const [pendingKey, setPendingKey] = useState<string | null>(null);
    if (pendingKey !== null && pendingKey === resolvedKey) {
        setPendingKey(null);
    }
    const activeKey = pendingKey ?? resolvedKey;

    const onNavClick = useCallback(
        (key: string) => {
            setPendingKey(key);
            onNavigate?.();
        },
        [onNavigate],
    );

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
        <>
            <Link
                href={"/"}
                onClick={() => onNavigate?.()}
                className="flex items-center gap-2 px-5 h-13 border-b border-border cursor-pointer shrink-0"
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
                    {!initialized
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <NavItemSkeleton key={i} />
                          ))
                        : nav.workspace.map((item) => (
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
                    {!initialized
                        ? Array.from({ length: 3 }).map((_, i) => (
                              <NavItemSkeleton key={i} />
                          ))
                        : nav.profile.map((item) => (
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
        </>
    );
}

function NavItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-2 py-1.5 animate-pulse">
            <span className="h-4 w-4 rounded-sm bg-secondary shrink-0" />
            <span className="h-2.5 w-24 rounded-full bg-secondary" />
        </div>
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
                    ? "bg-neutral-100 ring-1 ring-black/9 shadow-sm shadow-black/4"
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
    const isPremium = useMeStore((s) => s.me?.isPremium ?? false);

    return (
        <div className="rounded-lg border border-orange-200 bg-brand-soft p-3 m-2">
            <div className="flex items-center gap-2 text-[12px] font-medium">
                <SparklesIcon className="text-orange-600 h-3.5 w-3.5" />
                <span>{isPremium ? "You're on Pro" : "Upgrade to Pro"}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                {isPremium
                    ? "Thanks for upgrading — enjoy unlimited listings, priority placement, and team invites."
                    : "Unlimited listings, priority placement in search, team invites."}
            </p>
            {!isPremium && (
                <Link
                    href="/pricing"
                    className={cn(
                        "mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-orange-600",
                        "hover:underline cursor-pointer",
                    )}
                >
                    See plans
                    <ChevronRightIcon className="h-3 w-3" />
                </Link>
            )}
        </div>
    );
}
