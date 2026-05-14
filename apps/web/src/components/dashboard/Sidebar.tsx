import type { ComponentType, SVGProps } from "react";
import { cn } from "@/src/lib/utils";
import {
    BookOpenIcon,
    BookmarkIcon,
    BriefcaseIcon,
    BuildingIcon,
    ChevronRightIcon,
    FileTextIcon,
    HelpIcon,
    HomeIcon,
    SettingsIcon,
    SparklesIcon,
    UserIcon,
} from "@/src/components/dashboard/icons";
import { GiTie } from 'react-icons/gi';

type Item = {
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    href: string;
    badge?: string;
    active?: boolean;
};

const workspace: Item[] = [
    { label: "Dashboard", icon: HomeIcon, href: "/dashboard", active: true },
    { label: "Internships", icon: BriefcaseIcon, href: "#", badge: "1.2k" },
    { label: "Jobs", icon: BuildingIcon, href: "#" },
    { label: "Trainings", icon: BookOpenIcon, href: "#" },
    { label: "Applications", icon: FileTextIcon, href: "#", badge: "8" },
    { label: "Saved", icon: BookmarkIcon, href: "#" },
];

const profile: Item[] = [
    { label: "Resume", icon: FileTextIcon, href: "#" },
    { label: "Profile", icon: UserIcon, href: "#" },
    { label: "Settings", icon: SettingsIcon, href: "#" },
];

export function Sidebar() {
    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col w-60 shrink-0",
                "sticky top-0 h-screen",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border">
                <div className="">
                        <GiTie/>
                </div>
                <span className="text-[15px] font-semibold tracking-tight">
                    Internity
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <SectionLabel>Workspace</SectionLabel>
                <div className="space-y-0.5">
                    {workspace.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </div>

                <SectionLabel className="mt-6">Profile</SectionLabel>
                <div className="space-y-0.5">
                    {profile.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </div>

                <div className="mt-6 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                        <SparklesIcon className="text-brand h-3.5 w-3.5" />
                        <span>Upgrade to Pro</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                        Unlimited applications, priority support, and 1:1 mentor
                        sessions.
                    </p>
                    <a
                        href="#"
                        className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                    >
                        See plans
                        <ChevronRightIcon className="h-3 w-3" />
                    </a>
                </div>
            </nav>

            <div className="border-t border-sidebar-border p-3">
                <button
                    className={cn(
                        "flex w-full items-center gap-3 text-left",
                        "px-2 py-2 rounded-md",
                        "hover:bg-secondary transition-colors",
                    )}
                >
                    <span
                        className={cn(
                            "h-8 w-8 rounded-full",
                            "flex items-center justify-center",
                            "bg-linear-to-br from-pink-400 to-violet-500",
                            "text-white text-[12px] font-semibold",
                        )}
                    >
                        P
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium truncate">
                            Piyush Sharma
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                            B.Tech CSE · 2026
                        </span>
                    </span>
                    <HelpIcon className="text-muted-foreground h-4 w-4" />
                </button>
            </div>
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

function NavItem({ item }: { item: Item }) {
    const Icon = item.icon;
    return (
        <a
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                item.active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.badge}
                </span>
            )}
        </a>
    );
}
