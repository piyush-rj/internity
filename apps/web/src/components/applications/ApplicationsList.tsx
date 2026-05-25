"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
    PiBriefcase,
    PiBuildings,
    PiCalendar,
    PiCheckCircle,
    PiPulse,
} from "react-icons/pi";
import { ApiClientError } from "@/src/lib/apiClient";
import {
    SeenBadge,
    StatusBadge,
    type ApplicationCardItem,
} from "@/src/components/applications/ApplicationCard";
import { cn } from "@/src/lib/utils";

export function ApplicationsList({
    items,
    loading,
    error,
    emptyText = "You haven’t applied anywhere yet.",
    onWithdraw,
    header,
    compact = false,
}: {
    items: ApplicationCardItem[];
    loading: boolean;
    error: ApiClientError | Error | null;
    emptyText?: string;
    onWithdraw?: (id: string) => void;
    header?: ReactNode;
    compact?: boolean;
}) {
    const colCount = compact ? 5 : 6;
    return (
        <section className="rounded-md border border-border bg-card/90 backdrop-blur-sm shadow-xs overflow-hidden transition-shadow duration-200">
            {header && (
                <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                    {header}
                </header>
            )}
            {error ? (
                <ErrorRow message={error.message} />
            ) : (
                <div className={compact ? undefined : "overflow-x-auto"}>
                    <table
                        className={cn(
                            "w-full",
                            compact ? "text-[12.5px]" : "text-[13px]",
                        )}
                    >
                        <thead className="bg-neutral-100 border-b border-border">
                            <tr className="text-left text-muted-foreground divide-x divide-border">
                                <ColHeader
                                    icon={
                                        <PiBriefcase className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Role
                                </ColHeader>
                                <ColHeader
                                    icon={
                                        <PiBuildings className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Company
                                </ColHeader>
                                <ColHeader
                                    icon={
                                        <PiCheckCircle className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Status
                                </ColHeader>
                                <ColHeader
                                    icon={<PiPulse className="h-3.5 w-3.5" />}
                                    compact={compact}
                                >
                                    Mode
                                </ColHeader>
                                <ColHeader
                                    icon={
                                        <PiCalendar className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Applied
                                </ColHeader>
                                {!compact && <th className="w-10" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <SkeletonRows compact={compact} />
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={colCount}
                                        className="px-5 py-12 text-center text-[13px] text-muted-foreground"
                                    >
                                        {emptyText}
                                    </td>
                                </tr>
                            ) : (
                                items.map((app) => (
                                    <ApplicationRow
                                        key={app.id}
                                        application={app}
                                        onWithdraw={onWithdraw}
                                        compact={compact}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function ColHeader({
    icon,
    children,
    compact = false,
}: {
    icon: ReactNode;
    children: ReactNode;
    compact?: boolean;
}) {
    return (
        <th
            className={cn(
                "font-medium uppercase tracking-wide",
                compact
                    ? "px-2.5 py-2 text-[10.5px]"
                    : "px-4 py-2.5 text-[11.5px]",
            )}
        >
            <span className="inline-flex items-center gap-1.5">
                {icon}
                {children}
            </span>
        </th>
    );
}

function ApplicationRow({
    application,
    onWithdraw,
    compact = false,
}: {
    application: ApplicationCardItem;
    onWithdraw?: (id: string) => void;
    compact?: boolean;
}) {
    const { listing, status, appliedAt, seenAt } = application;
    const canWithdraw =
        !!onWithdraw &&
        status !== "WITHDRAWN" &&
        status !== "REJECTED" &&
        status !== "HIRED";

    return (
        <tr className="group hover:bg-secondary/40 transition-colors divide-x divide-border">
            <Td compact={compact} className={compact ? undefined : "min-w-50"}>
                <Link
                    href={`/home/listings/${listing.id}`}
                    className="flex items-center gap-2.5 min-w-0"
                >
                    <CompanyAvatar
                        name={listing.company.name}
                        logoUrl={listing.company.logoUrl}
                    />
                    <span className="font-medium text-foreground truncate group-hover:text-orange-600 transition-colors transform duration-200">
                        {listing.title}
                    </span>
                </Link>
            </Td>
            <Td compact={compact} className="text-muted-foreground">
                <span className="truncate">{listing.company.name}</span>
            </Td>
            <Td compact={compact}>
                <span className="inline-flex items-center gap-1.5">
                    <StatusBadge status={status} />
                    <SeenBadge status={status} seenAt={seenAt} />
                </span>
            </Td>
            <Td compact={compact}>
                <ModeBadge mode={listing.mode} />
            </Td>
            <Td
                compact={compact}
                className="text-muted-foreground tabular-nums"
            >
                {formatDate(appliedAt)}
            </Td>
            {!compact && (
                <Td className="w-10">
                    {canWithdraw && (
                        <button
                            type="button"
                            onClick={() => onWithdraw!(application.id)}
                            aria-label="Withdraw application"
                            className={cn(
                                "h-8 w-8 inline-flex items-center justify-center rounded-md",
                                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                "transition-colors",
                            )}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </Td>
            )}
        </tr>
    );
}

function Td({
    children,
    className,
    compact = false,
}: {
    children: ReactNode;
    className?: string;
    compact?: boolean;
}) {
    return (
        <td
            className={cn(
                "align-middle whitespace-nowrap",
                compact ? "px-2.5 py-2.5" : "px-4 py-3",
                className,
            )}
        >
            {children}
        </td>
    );
}

function CompanyAvatar({
    name,
    logoUrl,
}: {
    name: string;
    logoUrl: string | null;
}) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-7 w-7 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[12px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function ModeBadge({ mode }: { mode: "REMOTE" | "HYBRID" | "ONSITE" }) {
    const styles: Record<typeof mode, { wrap: string; dot: string }> = {
        REMOTE: {
            wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
            dot: "bg-emerald-500",
        },
        HYBRID: {
            wrap: "bg-amber-50 text-amber-700 border-amber-200",
            dot: "bg-amber-500",
        },
        ONSITE: {
            wrap: "bg-sky-50 text-sky-700 border-sky-200",
            dot: "bg-sky-500",
        },
    };
    const labels: Record<typeof mode, string> = {
        REMOTE: "Remote",
        HYBRID: "Hybrid",
        ONSITE: "On-site",
    };
    const s = styles[mode];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                s.wrap,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {labels[mode]}
        </span>
    );
}

function SkeletonRows({ compact = false }: { compact?: boolean }) {
    const cols = compact ? 5 : 6;
    return (
        <>
            {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse divide-x divide-border">
                    {Array.from({ length: cols }).map((__, j) => (
                        <td
                            key={j}
                            className={compact ? "px-2.5 py-2.5" : "px-4 py-3"}
                        >
                            <div className="h-3 rounded-full bg-muted" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div
            className={cn(
                "mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5",
                "px-3 py-2.5 text-[12.5px] text-destructive",
            )}
        >
            Couldn’t load applications — {message}
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
