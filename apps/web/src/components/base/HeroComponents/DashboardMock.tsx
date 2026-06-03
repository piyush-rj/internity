import Image from "next/image";
import { ArrowRight, Bell, Search } from "lucide-react";
import { GiTie } from "react-icons/gi";
import {
    PiBookOpenFill,
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
// home layout: sidebar + topbar + charts + recommendations + profile.
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
                        <ChartsRow />

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
    { label: "My Applications", Icon: PiFileTextFill },
    { label: "Saved", Icon: PiBookmarkSimpleFill },
    { label: "Messages", Icon: PiChatCircleFill },
    { label: "Schedules", Icon: PiCalendarCheckFill },
];

const PROFILE_NAV: NavItem[] = [
    { label: "Resume", Icon: PiFileTextFill },
    { label: "Profile", Icon: PiUserFill },
    { label: "Instructions", Icon: PiBookOpenFill },
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
            <div className="ml-auto flex items-center gap-2.5">
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
                Wednesday, 3 June
            </span>
        </div>
    );
}

/* ------------------------------- Charts -------------------------------- */

const COLORS = {
    applied: "#3b82f6",
    shortlisted: "#f59e0b",
    interview: "#8b5cf6",
    hired: "#10b981",
    saved: "#f59e0b",
    profile: "#10b981",
};

function ChartsRow() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <ApplicationStatusCard />
            <Last7DaysCard />
            <ProfileRingCard />
        </section>
    );
}

function ChartCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-xs min-w-0">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-[11.5px] sm:text-[13px] font-semibold truncate">
                        {title}
                    </div>
                    <div className="text-[9px] sm:text-[10.5px] text-muted-foreground truncate">
                        {subtitle}
                    </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10.5px] font-medium text-orange-600 shrink-0">
                    Open
                    <ArrowRight className="h-2.5 w-2.5" />
                </span>
            </div>
            {children}
        </div>
    );
}

type Segment = { value: number; color: string };

function Donut({
    segments,
    className,
    gap = 5,
    children,
}: {
    segments: Segment[];
    className?: string;
    gap?: number;
    children?: React.ReactNode;
}) {
    const size = 100;
    const stroke = 15;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const single = segments.length === 1;
    // Arc length of each segment and its start offset along the ring, both
    // derived without mutation so the render stays pure.
    const segLens = segments.map((s) => (s.value / total) * c);
    const offsets = segLens.map((_, i) =>
        segLens.slice(0, i).reduce((a, b) => a + b, 0),
    );

    return (
        <div className={cn("relative", className)}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth={stroke}
                    />
                    {segments.map((s, i) => {
                        const len = single
                            ? c
                            : Math.max(segLens[i]! - gap, 0.1);
                        return (
                            <circle
                                key={i}
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={stroke}
                                strokeLinecap={single ? "butt" : "round"}
                                strokeDasharray={`${len} ${c - len}`}
                                strokeDashoffset={-offsets[i]!}
                            />
                        );
                    })}
                </g>
            </svg>
            {children && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {children}
                </div>
            )}
        </div>
    );
}

function LegendDot({
    color,
    label,
    value,
}: {
    color: string;
    label: string;
    value: number;
}) {
    return (
        <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[10px] text-muted-foreground">
            <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
            />
            {label}
            <b className="text-foreground tabular-nums">{value}</b>
        </span>
    );
}

function ApplicationStatusCard() {
    const segments: Segment[] = [
        { value: 2, color: COLORS.applied },
        { value: 1, color: COLORS.shortlisted },
        { value: 1, color: COLORS.interview },
        { value: 1, color: COLORS.hired },
    ];
    return (
        <ChartCard title="Application status" subtitle="5 total">
            <div className="mt-2 flex justify-center">
                <Donut
                    segments={segments}
                    className="h-20 w-20 sm:h-24 sm:w-24"
                />
            </div>
            <div className="mt-2.5 flex flex-wrap justify-center gap-x-2.5 gap-y-1">
                <LegendDot color={COLORS.applied} label="Applied" value={2} />
                <LegendDot
                    color={COLORS.shortlisted}
                    label="Shortlisted"
                    value={1}
                />
                <LegendDot
                    color={COLORS.interview}
                    label="Interview"
                    value={1}
                />
                <LegendDot color={COLORS.hired} label="Hired" value={1} />
            </div>
        </ChartCard>
    );
}

const WEEK = [
    { day: "Thu", applied: 3, saved: 0 },
    { day: "Fri", applied: 2, saved: 1 },
    { day: "Sat", applied: 0, saved: 0 },
    { day: "Sun", applied: 0, saved: 0 },
    { day: "Mon", applied: 0, saved: 0 },
    { day: "Tue", applied: 0, saved: 0 },
    { day: "Wed", applied: 0, saved: 0 },
];
const WEEK_MAX = 4;

function Last7DaysCard() {
    return (
        <ChartCard title="Last 7 days" subtitle="Applied vs saved">
            <div className="mt-2 flex gap-1.5">
                {/* Y axis */}
                <div className="flex flex-col justify-between h-20 sm:h-24 text-[7px] sm:text-[8px] text-muted-foreground tabular-nums leading-none">
                    {[4, 3, 2, 1, 0].map((n) => (
                        <span key={n}>{n}</span>
                    ))}
                </div>
                {/* Plot */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-1 sm:gap-1.5 h-20 sm:h-24 border-b border-l border-border/70 pl-1">
                        {WEEK.map((d) => (
                            <div
                                key={d.day}
                                className="flex-1 flex items-end justify-center gap-0.5 h-full"
                            >
                                {d.applied > 0 && (
                                    <span
                                        className="w-1 sm:w-1.5 rounded-t-[2px]"
                                        style={{
                                            height: `${(d.applied / WEEK_MAX) * 100}%`,
                                            backgroundColor: COLORS.applied,
                                        }}
                                    />
                                )}
                                {d.saved > 0 && (
                                    <span
                                        className="w-1 sm:w-1.5 rounded-t-[2px]"
                                        style={{
                                            height: `${(d.saved / WEEK_MAX) * 100}%`,
                                            backgroundColor: COLORS.saved,
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 sm:gap-1.5 mt-1 pl-1">
                        {WEEK.map((d) => (
                            <span
                                key={d.day}
                                className="flex-1 text-center text-[7px] sm:text-[8px] text-muted-foreground"
                            >
                                {d.day}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-2 flex justify-center gap-3">
                <LegendDot color={COLORS.applied} label="Applied" value={5} />
                <LegendDot color={COLORS.saved} label="Saved" value={1} />
            </div>
        </ChartCard>
    );
}

function ProfileRingCard() {
    return (
        <ChartCard title="Profile completion" subtitle="5 of 5 sections">
            <div className="mt-2 flex justify-center">
                <Donut
                    segments={[{ value: 1, color: COLORS.profile }]}
                    className="h-20 w-20 sm:h-24 sm:w-24"
                >
                    <span className="text-[15px] sm:text-[19px] font-semibold tracking-tight leading-none">
                        100%
                    </span>
                    <span className="mt-0.5 text-[7.5px] sm:text-[9px] text-muted-foreground">
                        ready
                    </span>
                </Donut>
            </div>
        </ChartCard>
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
    { label: "Projects", done: true },
    { label: "Skills", done: true },
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
                    {done < total && (
                        <span className="text-orange-600 font-medium">
                            {total - done} left
                        </span>
                    )}
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
