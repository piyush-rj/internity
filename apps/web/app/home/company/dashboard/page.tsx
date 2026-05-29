"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PiCalendarCheckFill } from "react-icons/pi";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { ApplicationStatus, CompanyDashboard } from "@/src/lib/api";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { CountLegend } from "@/src/components/dashboard/StatsChartRow";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ChatAvatar } from "@/src/components/chat/ChatAvatar";
import {
    CompanyCardSkeleton,
    NoCompany,
} from "@/src/components/company/CompanyEmptyStates";
import {
    COMPANY_ROLE_BADGE_STYLE,
    canManageCompany,
    displayCompanyRole,
} from "@/src/lib/catalog/companyRoles";
import { useCompanyDashboard } from "@/src/hooks/useCompanyDashboard";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { cn } from "@/src/lib/utils";

export default function CompanyDashboardPage() {
    const router = useRouter();
    const { memberships, loading: empLoading } = useMyEmployer();
    const membership = memberships[0] ?? null;
    const role = membership?.role ?? null;
    const canAdmin = role ? canManageCompany(role) : false;
    const companyId = membership?.company.id ?? null;

    // Non-owners can't see the dashboard — bounce them to the profile. The
    // backend also enforces this with a 403, so the gate is belt-and-braces.
    useEffect(() => {
        if (empLoading) return;
        if (membership && !canAdmin) router.replace("/home/company/profile");
    }, [empLoading, membership, canAdmin, router]);

    const { data, loading, error } = useCompanyDashboard(
        canAdmin ? companyId : null,
    );

    if (!empLoading && !membership) {
        return (
            <EmptySection title="Company dashboard" description="">
                <NoCompany />
            </EmptySection>
        );
    }

    return (
        <EmptySection
            title="Company dashboard"
            description="Everything happening across your company — hiring, listings, interviews and your team."
        >
            {empLoading || (canAdmin && loading && !data) ? (
                <CompanyCardSkeleton />
            ) : error ? (
                <ErrorRow message={error.message} />
            ) : !data ? null : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ListingsOverview listings={data.listings} />
                        <HiringFunnel funnel={data.funnel} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <RecentApplicants items={data.recentApplicants} />
                        </div>
                        <InterviewsAndTeam
                            interviews={data.interviews}
                            team={data.team}
                        />
                    </div>
                </div>
            )}
        </EmptySection>
    );
}

// ---------------------------------------------------------------------------

const LISTING_SLICES: ReadonlyArray<{
    key: keyof CompanyDashboard["listings"];
    label: string;
    color: string;
}> = [
    { key: "active", label: "Active", color: "#10b981" },
    { key: "paused", label: "Paused", color: "#f59e0b" },
    { key: "expired", label: "Expired", color: "#a1a1aa" },
    { key: "closed", label: "Closed", color: "#f43f5e" },
];

function ListingsOverview({
    listings,
}: {
    listings: CompanyDashboard["listings"];
}) {
    const data = LISTING_SLICES.map((s) => ({
        name: s.label,
        value: listings[s.key] as number,
        color: s.color,
    })).filter((d) => d.value > 0);
    return (
        <section>
            <SectionHeader
                title="Listings"
                caption={`${listings.total} total`}
                href="/home/company/listings"
                cta="Manage listings"
            />
            <div className="rounded-lg border border-border bg-card p-4">
                {data.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-[12px] text-muted-foreground">
                        No listings yet
                    </div>
                ) : (
                    <>
                        <div className="relative h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={56}
                                        outerRadius={92}
                                        paddingAngle={2}
                                        stroke="none"
                                    >
                                        {data.map((d) => (
                                            <Cell key={d.name} fill={d.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        contentStyle={chartTooltip}
                                        itemStyle={{ fontSize: 12 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-[26px] font-semibold tabular-nums leading-none">
                                    {listings.total}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground">
                                    listings
                                </div>
                            </div>
                        </div>
                        <CountLegend items={data} />
                    </>
                )}
            </div>
            {listings.takenDown > 0 && (
                <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">
                    {listings.takenDown} listing
                    {listings.takenDown === 1 ? "" : "s"} taken down by an
                    admin.
                </p>
            )}
        </section>
    );
}

// ---------------------------------------------------------------------------

const FUNNEL_STAGES: ReadonlyArray<{
    key: Exclude<ApplicationStatus, "WITHDRAWN">;
    label: string;
    color: string;
}> = [
    { key: "APPLIED", label: "Applied", color: "#0ea5e9" },
    { key: "SHORTLISTED", label: "Shortlisted", color: "#f59e0b" },
    { key: "INTERVIEW", label: "Interview", color: "#8b5cf6" },
    { key: "HIRED", label: "Hired", color: "#10b981" },
    { key: "REJECTED", label: "Rejected", color: "#f43f5e" },
];

function HiringFunnel({ funnel }: { funnel: CompanyDashboard["funnel"] }) {
    const data = FUNNEL_STAGES.map((s) => ({
        name: `${s.label} · ${funnel[s.key]}`,
        value: funnel[s.key],
        color: s.color,
    }));
    return (
        <section>
            <SectionHeader
                title="Hiring funnel"
                caption={`${funnel.total} application${funnel.total === 1 ? "" : "s"} all-time`}
                href="/home/applicants"
                cta="Review applicants"
            />
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 6, right: 24, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: "#71717a" }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#3f3f46" }}
                                axisLine={false}
                                tickLine={false}
                                width={120}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{
                                    fill: "rgba(0,0,0,0.04)",
                                    radius: 4,
                                }}
                                contentStyle={chartTooltip}
                                itemStyle={{ fontSize: 12 }}
                            />
                            <Bar
                                dataKey="value"
                                name="Applications"
                                radius={[0, 6, 6, 0]}
                                maxBarSize={22}
                            >
                                {data.map((d) => (
                                    <Cell key={d.name} fill={d.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {funnel.WITHDRAWN > 0 && (
                    <p className="text-[11.5px] text-muted-foreground pt-2">
                        {funnel.WITHDRAWN} withdrawn by candidates.
                    </p>
                )}
            </div>
        </section>
    );
}

const chartTooltip: React.CSSProperties = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: 12,
    padding: "6px 10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<ApplicationStatus, string> = {
    APPLIED: "bg-sky-50 text-sky-700 border-sky-200",
    SHORTLISTED: "bg-amber-50 text-amber-700 border-amber-200",
    INTERVIEW: "bg-violet-50 text-violet-700 border-violet-200",
    HIRED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    WITHDRAWN: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

function RecentApplicants({
    items,
}: {
    items: CompanyDashboard["recentApplicants"];
}) {
    return (
        <section>
            <SectionHeader
                title="Recent applicants"
                href="/home/applicants"
                cta="See all"
            />
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {items.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                        No applications yet.
                    </p>
                ) : (
                    items.map((a) => (
                        <Link
                            key={a.id}
                            href={`/home/applicants?listingId=${a.listing.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                        >
                            <ChatAvatar
                                name={a.student.name}
                                image={a.student.image}
                                size="sm"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-medium truncate">
                                    {a.student.name ?? "Candidate"}
                                </div>
                                <div className="text-[12px] text-muted-foreground truncate">
                                    {formatListingTitle(a.listing.title)}
                                </div>
                            </div>
                            <span
                                className={cn(
                                    "shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                                    STATUS_BADGE[a.status],
                                )}
                            >
                                {STATUS_LABEL[a.status]}
                            </span>
                            <span className="shrink-0 w-16 text-right text-[11px] text-muted-foreground tabular-nums">
                                {timeAgo(a.appliedAt)}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------

function InterviewsAndTeam({
    interviews,
    team,
}: {
    interviews: CompanyDashboard["interviews"];
    team: CompanyDashboard["team"];
}) {
    return (
        <div className="space-y-4">
            <Link
                href="/home/schedules"
                className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary/40 transition-colors"
            >
                <div className="flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground">
                    <PiCalendarCheckFill className="h-4 w-4 text-violet-500" />
                    Upcoming interviews
                </div>
                <div className="mt-2 text-[26px] font-semibold tabular-nums leading-none">
                    {interviews.upcoming}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                    Scheduled and ahead — open Schedules
                    <ArrowRight className="h-3 w-3" />
                </div>
            </Link>

            <section className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="text-[13px] font-medium">
                        Team · {team.count}
                    </div>
                    <Link
                        href="/home/company/members"
                        className="text-[11.5px] font-medium text-brand hover:underline"
                    >
                        Manage
                    </Link>
                </div>
                <ul className="mt-3 space-y-2.5">
                    {team.members.slice(0, 6).map((m) => (
                        <li
                            key={m.userId}
                            className="flex items-center gap-2.5"
                        >
                            <ChatAvatar
                                name={m.name}
                                image={m.image}
                                size="sm"
                            />
                            <span className="min-w-0 flex-1 truncate text-[12.5px]">
                                {m.name ?? "Member"}
                            </span>
                            <span
                                className={cn(
                                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                    COMPANY_ROLE_BADGE_STYLE[m.role],
                                )}
                            >
                                {displayCompanyRole(m.role, m.customRole)}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

// ---------------------------------------------------------------------------

function SectionHeader({
    title,
    caption,
    href,
    cta,
}: {
    title: string;
    caption?: string;
    href: string;
    cta: string;
}) {
    return (
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
            <div className="flex items-baseline gap-2">
                <h2 className="text-[14px] font-medium">{title}</h2>
                {caption && (
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {caption}
                    </span>
                )}
            </div>
            <Link
                href={href}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:underline"
            >
                {cta}
                <ArrowRight className="h-3 w-3" />
            </Link>
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn’t load the dashboard — {message}
        </div>
    );
}

// Compact relative time (e.g. "3h", "2d") for the applicants feed.
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    const wk = Math.floor(day / 7);
    if (wk < 5) return `${wk}w`;
    return `${Math.floor(day / 30)}mo`;
}
