"use client";

import { memo, useCallback, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    PiBriefcaseFill,
    PiCheckCircleFill,
    PiCurrencyInrFill,
    PiHouseFill,
    PiUsersFill,
} from "react-icons/pi";
import { GiTie } from "react-icons/gi";
import { cn } from "@/src/lib/utils";

type IconComp = ComponentType<{ className?: string }>;

type Item = {
    key: string;
    label: string;
    icon: IconComp;
    href: string;
};

const NAV: Item[] = [
    {
        key: "overview",
        label: "Overview",
        icon: PiHouseFill,
        href: "/admin/overview",
    },
    {
        key: "approvals",
        label: "Approvals",
        icon: PiCheckCircleFill,
        href: "/admin/approvals",
    },
    {
        key: "listings",
        label: "Listings",
        icon: PiBriefcaseFill,
        href: "/admin/listings",
    },
    {
        key: "founders",
        label: "Founders",
        icon: PiUsersFill,
        href: "/admin/founders",
    },
    {
        key: "payments",
        label: "Payments",
        icon: PiCurrencyInrFill,
        href: "/admin/payments",
    },
];

function resolveActiveKey(pathname: string): string {
    const segment = pathname.split("/")[2] ?? "";
    return NAV.find((it) => it.key === segment)?.key ?? "approvals";
}

export function AdminSidebar() {
    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col w-60 shrink-0",
                "sticky top-0 h-screen",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <AdminSidebarBody />
        </aside>
    );
}

// inner admin sidebar shared by desktop aside and mobile drawer
export function AdminSidebarBody({
    onNavigate,
}: {
    onNavigate?: () => void;
} = {}) {
    const pathname = usePathname() ?? "/admin/approvals";
    const resolvedKey = resolveActiveKey(pathname);

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

    return (
        <>
            <Link
                href={"/admin/approvals"}
                onClick={() => onNavigate?.()}
                className="flex items-center gap-2 px-5 h-13 border-b border-border cursor-pointer shrink-0"
            >
                <div
                    className={cn(
                        "h-7.5 w-7.5 flex justify-center items-center bg-linear-to-b from-neutral-700 to-neutral-900 rounded-sm",
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
                        Admin console
                    </span>
                </div>
            </Link>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <SectionLabel>Admin</SectionLabel>
                <div className="space-y-0.5">
                    {NAV.map((item) => (
                        <NavItem
                            key={item.key}
                            item={item}
                            active={item.key === activeKey}
                            onClick={onNavClick}
                        />
                    ))}
                </div>
            </nav>
        </>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
        </Link>
    );
});
