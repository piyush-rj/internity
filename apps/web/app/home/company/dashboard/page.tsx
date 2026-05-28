"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
    PiBriefcaseFill,
    PiCalendarCheckFill,
    PiPauseFill,
    PiProhibitFill,
    PiClockCountdownFill,
} from "react-icons/pi";
import type { ApplicationStatus, CompanyDashboard } from "@/src/lib/api";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ChatAvatar } from "@/src/components/chat/ChatAvatar";
import {
    CompanyCardSkeleton,
    NoCompany,
} from "@/src/components/company/CompanyEmptyStates";
import {
    COMPANY_ROLE_BADGE_STYLE,
    COMPANY_ROLE_LABEL,
    canManageCompany,
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
                    <ListingsOverview listings={data.listings} />
                    <HiringFunnel funnel={data.funnel} />
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

const LISTING_TILES: ReadonlyArray<{
    key: keyof CompanyDashboard["listings"];
    label: string;
    icon: typeof PiBriefcaseFill;
    tint: string;
}> = [
    { key: "active", label: "Active", icon: PiBriefcaseFill, tint: "text-emerald-600" },
    { key: "paused", label: "Paused", icon: PiPauseFill, tint: "text-amber-600" },
    { key: "expired", label: "Expired", icon: PiClockCountdownFill, tint: "text-zinc-500" },
    { key: "closed", label: "Closed", icon: PiProhibitFill, tint: "text-rose-600" },
];

function ListingsOverview({
    listings,
}: {
    listings: CompanyDashboard["listings"];
}) {
    return (
        <section>
            <SectionHeader
                title="Listings"
                caption={`${listings.total} total`}
                href="/home/company/listings"
                cta="Manage listings"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LISTING_TILES.map((t) => {
                    const Icon = t.icon;
                    return (
                        <div
                            key={t.key}
                            className="rounded-lg border border-border bg-card p-4"
                        >
                            <Icon className={cn("h-4 w-4", t.tint)} />
                            <div className="mt-2 text-[22px] font-semibold tabular-nums leading-none">
                                {listings[t.key]}
                            </div>
                            <div className="mt-1 text-[12px] text-muted-foreground">
                                {t.label}
                            </div>
                        </div>
                    );
                })}
            </div>
            {listings.takenDown > 0 && (
                <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">
                    {listings.takenDown} listing
                    {listings.takenDown === 1 ? "" : "s"} taken down by an admin.
                </p>
            )}
        </section>
    );
}

// ---------------------------------------------------------------------------

const FUNNEL_STAGES: ReadonlyArray<{
    key: Exclude<ApplicationStatus, "WITHDRAWN">;
    label: string;
    wrap: string;
    bar: string;
}> = [
    { key: "APPLIED", label: "Applied", wrap: "text-sky-700", bar: "bg-sky-500" },
    { key: "SHORTLISTED", label: "Shortlisted", wrap: "text-amber-700", bar: "bg-amber-500" },
    { key: "INTERVIEW", label: "Interview", wrap: "text-violet-700", bar: "bg-violet-500" },
    { key: "HIRED", label: "Hired", wrap: "text-emerald-700", bar: "bg-emerald-500" },
    { key: "REJECTED", label: "Rejected", wrap: "text-rose-700", bar: "bg-rose-500" },
];

function HiringFunnel({ funnel }: { funnel: CompanyDashboard["funnel"] }) {
    const max = Math.max(
        1,
        ...FUNNEL_STAGES.map((s) => funnel[s.key]),
    );
    return (
        <section>
            <SectionHeader
                title="Hiring funnel"
                caption={`${funnel.total} application${funnel.total === 1 ? "" : "s"} all-time`}
                href="/home/applicants"
                cta="Review applicants"
            />
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                {FUNNEL_STAGES.map((s) => {
                    const value = funnel[s.key];
                    return (
                        <div key={s.key} className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-24 shrink-0 text-[12.5px] font-medium",
                                    s.wrap,
                                )}
                            >
                                {s.label}
                            </div>
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full", s.bar)}
                                    style={{
                                        width: `${(value / max) * 100}%`,
                                    }}
                                />
                            </div>
                            <div className="w-10 shrink-0 text-right text-[13px] font-semibold tabular-nums">
                                {value}
                            </div>
                        </div>
                    );
                })}
                {funnel.WITHDRAWN > 0 && (
                    <p className="text-[11.5px] text-muted-foreground pt-1">
                        {funnel.WITHDRAWN} withdrawn by candidates.
                    </p>
                )}
            </div>
        </section>
    );
}

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
                                    {a.listing.title}
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
                        <li key={m.userId} className="flex items-center gap-2.5">
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
                                {COMPANY_ROLE_LABEL[m.role]}
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
