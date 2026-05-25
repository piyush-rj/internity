"use client";
import { useState, type ComponentType } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { IconType } from "react-icons";
import {
    PiBookmarkSimpleFill,
    PiBriefcaseFill,
    PiFileTextFill,
    PiUserFill,
} from "react-icons/pi";
import { computeCompletion } from "@/src/components/profile-wizard/utils";
import { useMyApplications } from "@/src/hooks/useMyApplications";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useSavedStore } from "@/src/store/useSavedStore";
import { cn } from "@/src/lib/utils";

type Delta = {
    label: string;
    direction: "up" | "down" | "flat";
} | null;

type Accent = "sky" | "amber" | "violet" | "emerald";

type Stat = {
    label: string;
    value: string;
    caption: string;
    delta: Delta;
    icon: ComponentType<{ className?: string }> | IconType;
    accent: Accent;
    href: string;
};

const accentClasses: Record<Accent, string> = {
    sky: "bg-secondary text-foreground/70 ring-1 ring-border",
    amber: "bg-secondary text-foreground/70 ring-1 ring-border",
    violet: "bg-secondary text-foreground/70 ring-1 ring-border",
    emerald: "bg-secondary text-foreground/70 ring-1 ring-border",
};

export function StatsRow() {
    const { items: applications, loading: appsLoading } = useMyApplications();
    const savedItems = useSavedStore((s) => s.items);
    const savedLoading = useSavedStore((s) => s.loading);
    const { profile, loading: profileLoading } = useMyProfile();

    const [sevenDaysAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
    const appliedThisWeek = applications.filter(
        (a) => new Date(a.appliedAt).getTime() >= sevenDaysAgo,
    ).length;
    const savedThisWeek = savedItems.filter(
        (s) => new Date(s.createdAt).getTime() >= sevenDaysAgo,
    ).length;
    const interviewCount = applications.filter(
        (a) => a.status === "INTERVIEW",
    ).length;
    const shortlistedCount = applications.filter(
        (a) => a.status === "SHORTLISTED",
    ).length;

    const completion = computeCompletion(profile);
    const total = 7;
    const pct = completion.pct;
    const done = completion.count;

    const stats: Stat[] = [
        {
            label: "Applications",
            value: appsLoading ? "—" : String(applications.length),
            caption:
                appliedThisWeek > 0
                    ? `${appliedThisWeek} sent in the last 7 days`
                    : "Apply to start tracking",
            delta: appsLoading
                ? null
                : appliedThisWeek > 0
                  ? { label: `+${appliedThisWeek} this week`, direction: "up" }
                  : { label: "No new this week", direction: "flat" },
            icon: PiFileTextFill,
            accent: "sky",
            href: "/home/applications",
        },
        {
            label: "Saved",
            value: savedLoading ? "—" : String(savedItems.length),
            caption:
                savedItems.length === 0
                    ? "Bookmark roles to revisit"
                    : "Tap to review your list",
            delta: savedLoading
                ? null
                : savedThisWeek > 0
                  ? { label: `+${savedThisWeek} this week`, direction: "up" }
                  : null,
            icon: PiBookmarkSimpleFill,
            accent: "amber",
            href: "/home/saved",
        },
        {
            label: "Interviews",
            value: appsLoading ? "—" : String(interviewCount),
            caption:
                interviewCount === 0
                    ? shortlistedCount > 0
                        ? `${shortlistedCount} shortlisted — keep going`
                        : "None scheduled"
                    : "Prep is the half the battle",
            delta: appsLoading
                ? null
                : interviewCount > 0
                  ? { label: `${interviewCount} active`, direction: "up" }
                  : null,
            icon: PiBriefcaseFill,
            accent: "violet",
            href: "/home/applications",
        },
        {
            label: "Profile",
            value: profileLoading ? "—" : `${pct}%`,
            caption: profileLoading
                ? "Loading"
                : pct === 100
                  ? "Recruiter-ready"
                  : `${done}/${total} sections filled`,
            delta: profileLoading
                ? null
                : pct === 100
                  ? { label: "Complete", direction: "up" }
                  : { label: `${total - done} left`, direction: "down" },
            icon: PiUserFill,
            accent: "emerald",
            href: "/home/profile",
        },
    ];

    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
                <StatCard key={s.label} stat={s} />
            ))}
        </section>
    );
}

function StatCard({ stat }: { stat: Stat }) {
    const Icon = stat.icon;
    return (
        <Link
            href={stat.href}
            className={cn(
                "group relative rounded-lg border border-border bg-card/90 backdrop-blur-sm px-4 py-3.5",
                "shadow-xs transition-all duration-200 ease-out",
                "ring-0 ring-foreground/0 hover:ring-2 hover:ring-foreground/10",
            )}
        >
            <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                    <span
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-border/70",
                            accentClasses[stat.accent],
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                    {stat.delta && (
                        <span
                            className={cn(
                                "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full",
                                "ring-2 ring-card",
                                deltaDotStyles(stat.delta.direction),
                            )}
                        >
                            {stat.delta.direction === "up" && (
                                <ArrowUp className="h-2.5 w-2.5" />
                            )}
                            {stat.delta.direction === "down" && (
                                <ArrowDown className="h-2.5 w-2.5" />
                            )}
                        </span>
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {stat.label}
                        </span>
                    </div>
                    <div className="mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums leading-none">
                        {stat.value}
                    </div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground truncate">
                        {stat.caption}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function deltaDotStyles(direction: "up" | "down" | "flat"): string {
    if (direction === "up") return "bg-orange-500 text-white";
    if (direction === "down") return "bg-rose-500 text-white";
    return "bg-zinc-400 text-white";
}
