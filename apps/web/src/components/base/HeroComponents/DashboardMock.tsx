import Image from "next/image";
import { ArrowDown, ArrowUp, Bell, Search } from "lucide-react";
import { GiTie } from "react-icons/gi";
import {
    PiBookmarkSimpleFill,
    PiBriefcaseFill,
    PiCalendarCheckFill,
    PiCaretRight,
    PiChatCircleFill,
    PiCheckBold,
    PiFileTextFill,
    PiGearFill,
    PiHouseFill,
    PiMapPin,
    PiSealCheckFill,
    PiSparkleFill,
    PiUserFill,
} from "react-icons/pi";
import { cn } from "@/src/lib/utils";

// Static, marketing-only replica of the student dashboard at
// /home/dashboard. Self-contained — no data hooks — so it can render
// inside the landing page hero without auth context. Mirrors the full
// home layout: sidebar + topbar + main content.
export function DashboardMock() {
    return (
        <div
            className={cn(
                "overflow-hidden",
                "rounded-t-2xl border border-b-0 border-border",
                "bg-neutral-50",
                "shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)]",
            )}
        >
            {/* Browser chrome */}
            <div
                className={cn(
                    "flex items-center gap-2",
                    "border-b border-border bg-card",
                    "px-3 py-2 sm:px-4 sm:py-2.5",
                )}
            >
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-2 sm:ml-4 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    spiderskill.com / home / dashboard
                </div>
            </div>

            {/* App shell: sidebar + main column */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
                <DashboardSidebar />
                <div className="flex flex-col min-w-0">
                    <DashboardTopbar />
                    <div className="px-3 py-3 sm:px-5 sm:py-5 space-y-3 sm:space-y-4">
                        <Greeting />
                        <StatsRow />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div className="lg:col-span-2 min-w-0 space-y-3">
                                <DashboardTabs />
                            </div>
                            <div className="hidden lg:block min-w-0">
                                <ProfileCompletion />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Sidebar -------------------------------- */

type NavItem = {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    active?: boolean;
};

const WORKSPACE: NavItem[] = [
    { label: "Dashboard", Icon: PiHouseFill, active: true },
    { label: "Internships", Icon: PiBriefcaseFill },
    { label: "Applications", Icon: PiFileTextFill },
    { label: "Saved", Icon: PiBookmarkSimpleFill },
    { label: "Messages", Icon: PiChatCircleFill },
    { label: "Schedules", Icon: PiCalendarCheckFill },
];

const PROFILE_NAV: NavItem[] = [
    { label: "Resume", Icon: PiFileTextFill },
    { label: "Profile", Icon: PiUserFill },
    { label: "Settings", Icon: PiGearFill },
];

function DashboardSidebar() {
    return (
        <aside className="hidden sm:flex flex-col border-r border-border bg-sidebar min-h-110">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
                <div
                    className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-sm shrink-0",
                        "bg-linear-to-b from-neutral-700 to-neutral-900",
                        "shadow-sm shadow-black/10",
                    )}
                >
                    <GiTie className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-[12px] font-semibold leading-none">
                        SpiderSkill
                    </span>
                    <span className="text-[9px] text-black/50 mt-0.5 leading-none">
                        Caffeine to carrier
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 text-[11px]">
                <SidebarLabel>Workspace</SidebarLabel>
                <div className="space-y-0.5">
                    {WORKSPACE.map((item) => (
                        <SidebarNavItem key={item.label} item={item} />
                    ))}
                </div>

                <SidebarLabel className="mt-4">Profile</SidebarLabel>
                <div className="space-y-0.5">
                    {PROFILE_NAV.map((item) => (
                        <SidebarNavItem key={item.label} item={item} />
                    ))}
                </div>
            </nav>

            {/* Upgrade card */}
            <div className="m-2 rounded-md border border-orange-200 bg-brand-soft p-2.5">
                <div className="flex items-center gap-1.5 text-[10.5px] font-medium">
                    <PiSparkleFill className="h-3 w-3 text-orange-600" />
                    Upgrade to Pro
                </div>
                <p className="mt-1 text-[9.5px] text-muted-foreground leading-snug">
                    Unlimited listings, priority placement, team invites.
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-orange-600">
                    See plans
                    <PiCaretRight className="h-2.5 w-2.5" />
                </div>
            </div>
        </aside>
    );
}

function SidebarLabel({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "px-2 pb-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground",
                className,
            )}
        >
            {children}
        </div>
    );
}

function SidebarNavItem({ item }: { item: NavItem }) {
    const Icon = item.Icon;
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] font-medium",
                item.active
                    ? "bg-neutral-100 ring-1 ring-black/9 shadow-sm shadow-black/4"
                    : "text-muted-foreground",
            )}
        >
            <Icon
                className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    item.active ? "text-orange-500" : "text-neutral-500",
                )}
            />
            <span className="flex-1 truncate">{item.label}</span>
        </div>
    );
}

/* ------------------------------ Topbar --------------------------------- */

function DashboardTopbar() {
    return (
        <div className="flex items-center gap-3 px-3 sm:px-4 h-10 sm:h-12 border-b border-border bg-card">
            <span className="text-[11px] sm:text-[12px] font-medium text-foreground">
                Home
            </span>
            <div className="hidden md:flex flex-1 min-w-0 mx-2">
                <div className="flex items-center gap-2 w-full max-w-md px-2.5 py-1 rounded-md bg-secondary text-muted-foreground">
                    <Search className="h-3 w-3 shrink-0" />
                    <span className="text-[10.5px] truncate">
                        Search role, company, or skill…
                    </span>
                    <span className="ml-auto text-[9px] bg-card border border-border rounded px-1 py-0.5 font-mono shrink-0">
                        ⌘ + K
                    </span>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 h-6 px-2 rounded-md bg-orange-500 text-white text-[10px] font-medium">
                    Complete profile
                    <span className="bg-white/25 rounded-full px-1 text-[9px]">
                        86
                    </span>
                </span>
                <Bell className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:block h-6 w-6 rounded-full bg-secondary ring-1 ring-border" />
            </div>
        </div>
    );
}

/* ------------------------------ Greeting ------------------------------- */

function Greeting() {
    return (
        <div className="hidden sm:flex items-end justify-between gap-3">
            <h2 className="text-[18px] sm:text-[22px] font-semibold tracking-tight">
                Good afternoon, Piyush
            </h2>
            <span className="text-[11px] sm:text-[12px] text-muted-foreground">
                Thursday, 28 May
            </span>
        </div>
    );
}

/* ------------------------------- Stats --------------------------------- */

type Stat = {
    label: string;
    value: string;
    caption: string;
    direction: "up" | "down" | "flat";
    Icon: React.ComponentType<{ className?: string }>;
};

const STATS: Stat[] = [
    {
        label: "Applications",
        value: "1",
        caption: "1 sent in the last 7 days",
        direction: "up",
        Icon: PiFileTextFill,
    },
    {
        label: "Saved",
        value: "0",
        caption: "Bookmark roles to revisit",
        direction: "flat",
        Icon: PiBookmarkSimpleFill,
    },
    {
        label: "Interviews",
        value: "0",
        caption: "None scheduled",
        direction: "flat",
        Icon: PiBriefcaseFill,
    },
    {
        label: "Profile",
        value: "86%",
        caption: "6/7 sections filled",
        direction: "down",
        Icon: PiUserFill,
    },
];

function StatsRow() {
    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {STATS.map((s) => (
                <StatCard key={s.label} stat={s} />
            ))}
        </section>
    );
}

function StatCard({ stat }: { stat: Stat }) {
    const Icon = stat.Icon;
    return (
        <div
            className={cn(
                "rounded-lg border border-border bg-card/90 px-2.5 py-2 sm:px-3.5 sm:py-3",
                "shadow-xs",
            )}
        >
            <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="relative shrink-0">
                    <span className="flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-secondary text-foreground/70 ring-1 ring-border">
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                    <span
                        className={cn(
                            "absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full ring-2 ring-card",
                            stat.direction === "up"
                                ? "bg-orange-500 text-white"
                                : stat.direction === "down"
                                  ? "bg-rose-500 text-white"
                                  : "bg-zinc-400 text-white",
                        )}
                    >
                        {stat.direction === "up" && (
                            <ArrowUp className="h-2 w-2" />
                        )}
                        {stat.direction === "down" && (
                            <ArrowDown className="h-2 w-2" />
                        )}
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                    </div>
                    <div className="mt-0.5 text-[13px] sm:text-[18px] font-semibold tracking-tight leading-none tabular-nums">
                        {stat.value}
                    </div>
                    {/* Captions are extra context that just adds noise on
                        small screens — hide them below sm. */}
                    <div className="hidden sm:block mt-1 text-[11px] text-muted-foreground truncate">
                        {stat.caption}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --------------------------- Dashboard tabs ---------------------------- */

type ListingRow = {
    role: string;
    company: string;
    logo: string;
    mode: "Remote" | "Hybrid" | "On-site";
    stipend: string;
    posted: string;
    verified?: boolean;
};

const LISTINGS: ListingRow[] = [
    {
        role: "Frontend Engineering Intern",
        company: "Razorpay",
        logo: "/brand-logos/razorpay-logo.png",
        mode: "Hybrid",
        stipend: "₹30,000",
        posted: "Today",
        verified: true,
    },
    {
        role: "Product Design Intern",
        company: "Swiggy",
        logo: "/brand-logos/swiggy.jpeg",
        mode: "On-site",
        stipend: "₹25,000",
        posted: "2d ago",
        verified: true,
    },
    {
        role: "Growth Marketing Intern",
        company: "CRED",
        logo: "/brand-logos/cred.jpeg",
        mode: "Hybrid",
        stipend: "₹22,000",
        posted: "3d ago",
        verified: true,
    },
    {
        role: "Data Science Intern",
        company: "Zomato",
        logo: "/brand-logos/zomato.png",
        mode: "Remote",
        stipend: "₹28,000",
        posted: "5d ago",
        verified: true,
    },
];

function DashboardTabs() {
    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <nav
                    aria-hidden
                    className="relative inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs"
                >
                    <span className="relative z-10 inline-flex items-center h-6 sm:h-7 px-2.5 sm:px-3 rounded-md text-[11px] sm:text-[12px] font-medium bg-orange-500 text-white">
                        Recommended
                    </span>
                    <span className="relative z-10 inline-flex items-center h-6 sm:h-7 px-2.5 sm:px-3 rounded-md text-[11px] sm:text-[12px] font-medium text-muted-foreground">
                        Applications
                    </span>
                </nav>
                <span className="hidden sm:inline-flex text-[10.5px] sm:text-[11px] text-muted-foreground items-center gap-1">
                    see all recommended internships
                    <PiCaretRight className="h-2.5 w-2.5" />
                </span>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[1.4fr_0.7fr_0.6fr] sm:grid-cols-[1.4fr_1fr_0.6fr_0.7fr_0.6fr] px-3 sm:px-4 py-2 border-b border-border text-[9.5px] sm:text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Role</span>
                    <span className="hidden sm:block">Company</span>
                    <span>Mode</span>
                    <span>Stipend</span>
                    <span className="hidden sm:block">Posted</span>
                </div>
                <ul className="divide-y divide-border">
                    {LISTINGS.map((l, i) => (
                        <ListingItem
                            key={l.role}
                            listing={l}
                            // Keep only the first 2 rows on mobile so the
                            // mock stays compact; full list shows from sm.
                            hideOnMobile={i >= 2}
                        />
                    ))}
                </ul>
            </div>
        </>
    );
}

function ListingItem({
    listing,
    hideOnMobile,
}: {
    listing: ListingRow;
    hideOnMobile?: boolean;
}) {
    return (
        <li
            className={cn(
                "grid grid-cols-[1.4fr_0.7fr_0.6fr] sm:grid-cols-[1.4fr_1fr_0.6fr_0.7fr_0.6fr] items-center px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-[12.5px] hover:bg-secondary/30",
                hideOnMobile && "hidden sm:grid",
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-md overflow-hidden bg-white ring-1 ring-border shrink-0">
                    <Image
                        src={listing.logo}
                        alt={`${listing.company} logo`}
                        fill
                        sizes="32px"
                        className="object-cover"
                    />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">
                        {listing.role}
                    </span>
                    <span className="sm:hidden block text-[10px] text-muted-foreground truncate">
                        {listing.company}
                    </span>
                </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 min-w-0">
                <span className="truncate">{listing.company}</span>
                {listing.verified && (
                    <PiSealCheckFill
                        className="h-3 w-3 text-orange-500 shrink-0"
                        aria-label="Verified"
                    />
                )}
            </div>
            <div>
                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-medium border",
                        listing.mode === "Remote"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : listing.mode === "Hybrid"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-amber-50 text-amber-700 border-amber-200",
                    )}
                >
                    <PiMapPin className="h-2.5 w-2.5" />
                    {listing.mode}
                </span>
            </div>
            <span className="text-foreground/90 tabular-nums">
                {listing.stipend}
            </span>
            <span className="hidden sm:block text-muted-foreground tabular-nums">
                {listing.posted}
            </span>
        </li>
    );
}

/* -------------------------- Profile completion ------------------------- */

const PROFILE_STEPS = [
    { label: "Basics", done: true },
    { label: "Education", done: true },
    { label: "Experience", done: true },
    { label: "Projects", done: true },
    { label: "Skills", done: true },
    { label: "Certifications", done: false },
    { label: "Languages", done: true },
];

function ProfileCompletion() {
    const done = PROFILE_STEPS.filter((s) => s.done).length;
    const total = PROFILE_STEPS.length;
    const pct = Math.round((done / total) * 100);

    return (
        <section className="rounded-md border border-border bg-card/90 shadow-xs p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-[13px] sm:text-[14px] font-semibold">
                    Complete your profile
                </h3>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10.5px] sm:text-[11px] font-semibold text-orange-600 ring-1 ring-orange-100 tabular-nums">
                    {done}/{total}
                </span>
            </div>

            <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-orange-600"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[10.5px] tabular-nums">
                    <span className="text-muted-foreground">
                        {pct}% complete
                    </span>
                    <span className="text-orange-600 font-medium">
                        {total - done} left
                    </span>
                </div>
            </div>

            <ul className="mt-3 space-y-0.5">
                {PROFILE_STEPS.map((s) => (
                    <li
                        key={s.label}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11.5px] sm:text-[12.5px]"
                    >
                        <span
                            className={cn(
                                "flex h-3.5 w-3.5 items-center justify-center rounded-full shrink-0",
                                s.done
                                    ? "bg-emerald-500 text-white"
                                    : "border border-border bg-card",
                            )}
                        >
                            {s.done && <PiCheckBold className="h-2 w-2" />}
                        </span>
                        <span className="truncate">{s.label}</span>
                        {!s.done && (
                            <PiCaretRight className="ml-auto h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
