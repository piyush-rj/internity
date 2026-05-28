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
import { CountLegend } from "@/src/components/dashboard/StatsChartRow";
import { useCompanyMembers } from "@/src/hooks/useCompanyMembers";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMyListings, type MyListing } from "@/src/hooks/useMyListings";

const LISTING_COLORS = {
    Active: "#10b981",
    Paused: "#f59e0b",
    Expired: "#a1a1aa",
    Closed: "#f43f5e",
} as const;

export function EmployerChartRow() {
    const { items: listings, loading: listingsLoading } = useMyListings();
    const { memberships } = useMyEmployer();
    const companyId = memberships[0]?.company.id ?? null;
    const { members, loading: membersLoading } = useCompanyMembers(companyId);

    const [now] = useState(() => Date.now());

    // Mirrors the server's mutually-exclusive bucketing in
    // controller.company.get_dashboard.ts:
    //   takenDown > closed > paused > expired > active
    // takenDown listings are excluded from the donut (admin-only state).
    let activeCount = 0;
    let pausedCount = 0;
    let expiredCount = 0;
    let closedCount = 0;
    for (const l of listings) {
        if (l.takenDownAt) continue;
        if (l.closedAt) closedCount += 1;
        else if (l.pausedAt) pausedCount += 1;
        else if (l.expiresAt && new Date(l.expiresAt).getTime() <= now)
            expiredCount += 1;
        else activeCount += 1;
    }

    const totalApplicants = listings.reduce(
        (s, l) => s + (l._count?.applications ?? 0),
        0,
    );
    const totalSeen = listings.reduce(
        (s, l) => s + (l._count?.applicationsSeen ?? 0),
        0,
    );
    const reviewPct =
        totalApplicants === 0
            ? 0
            : Math.round((totalSeen / totalApplicants) * 100);

    const listingStatus = [
        { name: "Active", value: activeCount },
        { name: "Paused", value: pausedCount },
        { name: "Expired", value: expiredCount },
        { name: "Closed", value: closedCount },
    ].filter((s) => s.value > 0);

    const topListings = topByApplicants(listings, 5);

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
                title="Listings status"
                caption={
                    listingsLoading
                        ? "Loading"
                        : `${listings.length} listing${listings.length === 1 ? "" : "s"} total`
                }
                href="/home/manage-listings"
                footer={
                    <TeamFooter
                        loading={membersLoading}
                        count={members.length}
                    />
                }
            >
                {listingsLoading ? (
                    <ChartSkeleton />
                ) : listingStatus.length === 0 ? (
                    <EmptyChart message="Post your first listing" />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={listingStatus}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={48}
                                    outerRadius={78}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {listingStatus.map((s) => (
                                        <Cell
                                            key={s.name}
                                            fill={
                                                LISTING_COLORS[
                                                    s.name as keyof typeof LISTING_COLORS
                                                ]
                                            }
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
                            items={listingStatus.map((s) => ({
                                name: s.name,
                                value: s.value,
                                color: LISTING_COLORS[
                                    s.name as keyof typeof LISTING_COLORS
                                ],
                            }))}
                        />
                    </>
                )}
            </ChartCard>

            <ChartCard
                title="Applicants by listing"
                caption={
                    listingsLoading
                        ? "Loading"
                        : totalApplicants === 0
                          ? "No applications yet"
                          : `${totalApplicants} total`
                }
                href="/home/applicants"
            >
                {listingsLoading ? (
                    <ChartSkeleton />
                ) : topListings.length === 0 ? (
                    <EmptyChart message="No applications yet" />
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={topListings}
                            layout="vertical"
                            margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
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
                                tick={{ fontSize: 11, fill: "#52525b" }}
                                axisLine={false}
                                tickLine={false}
                                width={108}
                                interval={0}
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
                                dataKey="applicants"
                                name="Applicants"
                                fill="#0ea5e9"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={22}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            <ChartCard
                title="Application review"
                caption={
                    listingsLoading
                        ? "Loading"
                        : totalApplicants === 0
                          ? "Nothing to review"
                          : `${totalSeen} of ${totalApplicants} reviewed`
                }
                href="/home/applicants"
            >
                {listingsLoading ? (
                    <ChartSkeleton />
                ) : (
                    <div className="relative h-55">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="72%"
                                outerRadius="100%"
                                data={[
                                    {
                                        name: "Seen",
                                        value: reviewPct,
                                        fill: "#8b5cf6",
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
                                {reviewPct}%
                            </div>
                            <div className="mt-1.5 text-[11.5px] text-muted-foreground">
                                {totalApplicants === 0
                                    ? "No applicants"
                                    : reviewPct === 100
                                      ? "All caught up"
                                      : `${totalApplicants - totalSeen} unseen`}
                            </div>
                        </div>
                    </div>
                )}
            </ChartCard>
        </section>
    );
}

function topByApplicants(listings: MyListing[], n: number) {
    return [...listings]
        .map((l) => ({
            name: shortTitle(l.title),
            applicants: l._count?.applications ?? 0,
        }))
        .filter((d) => d.applicants > 0)
        .sort((a, b) => b.applicants - a.applicants)
        .slice(0, n)
        .map((d) => ({ ...d, name: `${d.name} · ${d.applicants}` }));
}

function shortTitle(t: string): string {
    if (t.length <= 18) return t;
    return t.slice(0, 17) + "…";
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
    footer,
}: {
    title: string;
    caption: string;
    href: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
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
            {footer}
        </div>
    );
}

function TeamFooter({ loading, count }: { loading: boolean; count: number }) {
    return (
        <Link
            href="/home/company"
            className="mt-3 flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-[12px] hover:bg-secondary"
        >
            <span className="text-muted-foreground">Team</span>
            <span className="font-semibold tabular-nums">
                {loading ? "—" : count}
            </span>
        </Link>
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
