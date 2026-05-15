"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { IconType } from "react-icons";
import {
    PiBookmarkSimpleFill,
    PiBriefcaseFill,
    PiFileTextFill,
    PiUsersThreeFill,
} from "react-icons/pi";
import { useCompanyMembers } from "@/src/hooks/useCompanyMembers";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMyListings } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

type Delta = {
    label: string;
    direction: "up" | "down" | "flat";
} | null;

type Stat = {
    label: string;
    value: string;
    caption: string;
    delta: Delta;
    icon: ComponentType<{ className?: string }> | IconType;
    href: string;
};

export function EmployerStatsRow() {
    const { items: listings, loading: listingsLoading } = useMyListings();
    const { memberships } = useMyEmployer();
    const companyId = memberships[0]?.company.id ?? null;
    const { members, loading: membersLoading } = useCompanyMembers(companyId);

    const openListings = listings.filter((l) => !l.closedAt).length;
    const closedListings = listings.length - openListings;
    const totalApplicants = listings.reduce(
        (sum, l) => sum + (l._count?.applications ?? 0),
        0,
    );

    const stats: Stat[] = [
        {
            label: "Open listings",
            value: listingsLoading ? "—" : String(openListings),
            caption: listingsLoading
                ? "Loading"
                : closedListings > 0
                  ? `${closedListings} closed`
                  : "All active",
            delta: listingsLoading
                ? null
                : openListings > 0
                  ? { label: "Active", direction: "up" }
                  : { label: "None open", direction: "down" },
            icon: PiBriefcaseFill,
            href: "/home/manage-listings",
        },
        {
            label: "Total listings",
            value: listingsLoading ? "—" : String(listings.length),
            caption: listingsLoading
                ? "Loading"
                : listings.length === 0
                  ? "Post your first"
                  : "Across your company",
            delta: listingsLoading
                ? null
                : listings.length > 0
                  ? { label: `${listings.length} posted`, direction: "up" }
                  : null,
            icon: PiBookmarkSimpleFill,
            href: "/home/manage-listings",
        },
        {
            label: "Applicants",
            value: listingsLoading ? "—" : String(totalApplicants),
            caption: listingsLoading
                ? "Loading"
                : totalApplicants === 0
                  ? "No one yet"
                  : "Across all roles",
            delta: listingsLoading
                ? null
                : totalApplicants > 0
                  ? { label: `${totalApplicants} total`, direction: "up" }
                  : null,
            icon: PiFileTextFill,
            href: "/home/applicants",
        },
        {
            label: "Team",
            value: membersLoading ? "—" : String(members.length),
            caption: membersLoading
                ? "Loading"
                : members.length <= 1
                  ? "Invite teammates"
                  : `${members.length} people`,
            delta: membersLoading
                ? null
                : members.length > 1
                  ? { label: "Team set", direction: "up" }
                  : { label: "Solo", direction: "down" },
            icon: PiUsersThreeFill,
            href: "/home/company",
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
                "group relative rounded-xl border border-border bg-card/90 backdrop-blur-sm px-4 py-3.5",
                "shadow-xs transition-all duration-200 ease-out",
                "ring-0 ring-foreground/0 hover:ring-2 hover:ring-foreground/10",
            )}
        >
            <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                    <span
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-border/70",
                            "bg-secondary text-foreground/70",
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
