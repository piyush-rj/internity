"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    completionSteps,
    computeCompletion,
} from "@/src/components/profile-wizard/utils";
import { useMyApplications } from "@/src/hooks/useMyApplications";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useSavedStore } from "@/src/store/useSavedStore";

const STATUS_COLORS: Record<string, string> = {
    Applied: "#0ea5e9",
    Shortlisted: "#f59e0b",
    Interview: "#8b5cf6",
    Hired: "#10b981",
    Rejected: "#f43f5e",
    Withdrawn: "#a1a1aa",
};

const STATUS_ORDER = [
    "Applied",
    "Shortlisted",
    "Interview",
    "Hired",
    "Rejected",
    "Withdrawn",
] as const;

const STATUS_KEY: Record<string, string> = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

export function StatsChartRow() {
    const { items: applications, loading: appsLoading } = useMyApplications();
    const savedItems = useSavedStore((s) => s.items);
    const savedLoading = useSavedStore((s) => s.loading);
    const { profile, loading: profileLoading } = useMyProfile();

    const [now] = useState(() => Date.now());
    const completion = computeCompletion(profile);

    const statusCounts: Record<string, number> = {};
    for (const a of applications) {
        const label = STATUS_KEY[a.status] ?? "Applied";
        statusCounts[label] = (statusCounts[label] ?? 0) + 1;
    }
    const statusData = STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => ({
        name: s,
        value: statusCounts[s] ?? 0,
    }));

    const activity = buildActivity(applications, savedItems, now);

    const totalApps = applications.length;

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
                title="Application status"
                caption={
                    appsLoading
                        ? "Loading"
                        : totalApps === 0
                          ? "Apply to see your pipeline"
                          : `${totalApps} total`
                }
                href="/home/applications"
            >
                {appsLoading ? (
                    <ChartSkeleton />
                ) : statusData.length === 0 ? (
                    <EmptyChart message="No applications yet" />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={48}
                                    outerRadius={78}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {statusData.map((s) => (
                                        <Cell
                                            key={s.name}
                                            fill={STATUS_COLORS[s.name]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ fontSize: 12 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <CountLegend
                            items={statusData.map((s) => ({
                                name: s.name,
                                value: s.value,
                                color: STATUS_COLORS[s.name],
                            }))}
                        />
                    </>
                )}
            </ChartCard>

            <ChartCard
                title="Last 7 days"
                caption={
                    appsLoading || savedLoading ? "Loading" : "Applied vs saved"
                }
                href="/home/applications"
            >
                {appsLoading || savedLoading ? (
                    <ChartSkeleton />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart
                                data={activity}
                                margin={{
                                    top: 10,
                                    right: 8,
                                    left: -16,
                                    bottom: 0,
                                }}
                            >
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 11, fill: "#71717a" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#71717a" }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{
                                        fill: "rgba(0,0,0,0.04)",
                                        radius: 4,
                                    }}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ fontSize: 12 }}
                                />
                                <Bar
                                    dataKey="applied"
                                    name="Applied"
                                    fill="#0ea5e9"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                />
                                <Bar
                                    dataKey="saved"
                                    name="Saved"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        <CountLegend
                            items={[
                                {
                                    name: "Applied",
                                    value: activity.reduce(
                                        (s, d) => s + d.applied,
                                        0,
                                    ),
                                    color: "#0ea5e9",
                                },
                                {
                                    name: "Saved",
                                    value: activity.reduce(
                                        (s, d) => s + d.saved,
                                        0,
                                    ),
                                    color: "#f59e0b",
                                },
                            ]}
                        />
                    </>
                )}
            </ChartCard>

            <ChartCard
                title="Profile completion"
                caption={
                    profileLoading
                        ? "Loading"
                        : `${completion.count} of ${completionSteps.length} sections`
                }
                href="/home/profile"
            >
                {profileLoading ? (
                    <ChartSkeleton />
                ) : (
                    <div className="relative h-55">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="72%"
                                outerRadius="100%"
                                data={[
                                    {
                                        name: "Profile",
                                        value: completion.pct,
                                        fill: "#10b981",
                                    },
                                ]}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tick={false}
                                />
                                <RadialBar
                                    background={{ fill: "#f4f4f5" }}
                                    dataKey="value"
                                    cornerRadius={12}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-[30px] font-semibold tabular-nums leading-none">
                                {completion.pct}%
                            </div>
                            <div className="mt-1.5 text-[11.5px] text-muted-foreground">
                                {completion.pct === 100
                                    ? "Recruiter-ready"
                                    : `${completionSteps.length - completion.count} sections left`}
                            </div>
                        </div>
                    </div>
                )}
            </ChartCard>
        </section>
    );
}

function buildActivity(
    applications: { appliedAt: string }[],
    saved: { createdAt: string }[],
    now: number,
) {
    const days: { day: string; applied: number; saved: number; ts: number }[] =
        [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        d.setHours(0, 0, 0, 0);
        days.push({
            day: d.toLocaleDateString(undefined, { weekday: "short" }),
            applied: 0,
            saved: 0,
            ts: d.getTime(),
        });
    }
    const bucketFor = (iso: string) => {
        const t = new Date(iso).getTime();
        for (let i = days.length - 1; i >= 0; i--) {
            if (t >= days[i].ts) return days[i];
        }
        return null;
    };
    for (const a of applications) {
        const b = bucketFor(a.appliedAt);
        if (b) b.applied += 1;
    }
    for (const s of saved) {
        const b = bucketFor(s.createdAt);
        if (b) b.saved += 1;
    }
    return days.map(({ day, applied, saved }) => ({ day, applied, saved }));
}

const tooltipStyle: React.CSSProperties = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: 12,
    padding: "6px 10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function ChartCard({
    title,
    caption,
    href,
    children,
}: {
    title: string;
    caption: string;
    href: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-card/90 backdrop-blur-sm p-4 shadow-xs">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold tracking-tight">
                        {title}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                        {caption}
                    </p>
                </div>
                <Link
                    href={href}
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                >
                    Open
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            {children}
        </div>
    );
}

export function CountLegend({
    items,
}: {
    items: { name: string; value: number; color: string }[];
}) {
    return (
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {items.map((it) => (
                <li
                    key={it.name}
                    className="inline-flex items-center gap-1.5 text-[11.5px]"
                >
                    <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: it.color }}
                        aria-hidden
                    />
                    <span className="text-foreground/70">{it.name}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {it.value}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function ChartSkeleton() {
    return (
        <div className="h-55 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-secondary animate-pulse" />
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="h-55 flex items-center justify-center text-[12px] text-muted-foreground">
            {message}
        </div>
    );
}
