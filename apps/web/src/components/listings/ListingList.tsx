"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
    PiBookmarkSimple,
    PiBookmarkSimpleFill,
    PiBriefcase,
    PiBuildings,
    PiClock,
    PiCurrencyInr,
    PiCalendar,
    PiMapPin,
    PiPulse,
} from "react-icons/pi";
import type { ListingWithCompany } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useIsSaved, useSavedStore } from "@/src/store/useSavedStore";
import { useMe } from "@/src/hooks/useMe";
import { useMultiSelectStore } from "@/src/store/useMultiSelectStore";
import { VerifiedBadge } from "@/src/components/listings/VerifiedBadge";
import { cn } from "@/src/lib/utils";

export function ListingList({
    items,
    loading,
    error,
    emptyText = "No listings yet — check back soon.",
    header,
    compact = false,
}: {
    items: ListingWithCompany[];
    loading: boolean;
    error: ApiClientError | Error | null;
    emptyText?: string;
    header?: ReactNode;
    compact?: boolean;
}) {
    const { me } = useMe();
    const selectable = !compact && me?.role === "STUDENT";
    const colCount = (compact ? 6 : 8) + (selectable ? 1 : 0);
    return (
        <section className="rounded-md border border-border bg-card/90 backdrop-blur-sm shadow-xs overflow-hidden transition-shadow duration-200">
            {header && (
                <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-neutral-100">
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
                        <thead className="border-b border-border bg-neutral-100">
                            <tr className="text-left text-muted-foreground divide-x divide-border">
                                {selectable && (
                                    <th className="w-10 px-3 py-2.5">
                                        <SelectAllCheckbox items={items} />
                                    </th>
                                )}
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
                                    icon={<PiPulse className="h-3.5 w-3.5" />}
                                    compact={compact}
                                >
                                    Mode
                                </ColHeader>
                                <ColHeader
                                    icon={
                                        <PiCurrencyInr className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Stipend
                                </ColHeader>
                                {!compact && (
                                    <ColHeader
                                        icon={
                                            <PiClock className="h-3.5 w-3.5" />
                                        }
                                        compact={compact}
                                    >
                                        Duration
                                    </ColHeader>
                                )}
                                {!compact && (
                                    <ColHeader
                                        icon={
                                            <PiMapPin className="h-3.5 w-3.5" />
                                        }
                                        compact={compact}
                                    >
                                        Location
                                    </ColHeader>
                                )}
                                <ColHeader
                                    icon={
                                        <PiCalendar className="h-3.5 w-3.5" />
                                    }
                                    compact={compact}
                                >
                                    Posted
                                </ColHeader>
                                {!compact && <th className="w-10" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <SkeletonRows
                                    compact={compact}
                                    selectable={selectable}
                                />
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
                                items.map((listing) => (
                                    <ListingRow
                                        key={listing.id}
                                        listing={listing}
                                        compact={compact}
                                        selectable={selectable}
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
                    : "px-4 py-2.5 text-[12px]",
            )}
        >
            <span className="inline-flex items-center gap-1.5">
                {icon}
                {children}
            </span>
        </th>
    );
}

function ListingRow({
    listing,
    compact = false,
    selectable = false,
}: {
    listing: ListingWithCompany;
    compact?: boolean;
    selectable?: boolean;
}) {
    return (
        <tr className="group hover:bg-secondary/40 transition-colors divide-x divide-border">
            {selectable && (
                <Td className="w-10 px-3">
                    <RowCheckbox listing={listing} />
                </Td>
            )}
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
                <span className="inline-flex items-center gap-1 min-w-0">
                    <span className="truncate">{listing.company.name}</span>
                    {listing.company.verificationStatus === "APPROVED" && (
                        <VerifiedBadge />
                    )}
                </span>
            </Td>
            <Td compact={compact}>
                <ModeBadge mode={listing.mode} />
            </Td>
            <Td compact={compact} className="tabular-nums">
                {listing.stipendMin || listing.stipendMax ? (
                    <span className="text-foreground font-medium">
                        {formatStipend(listing.stipendMin, listing.stipendMax)}
                        <span className="text-muted-foreground font-normal">
                            {" "}
                            /mo
                        </span>
                    </span>
                ) : (
                    <Dash />
                )}
            </Td>
            {!compact && (
                <Td className="text-muted-foreground tabular-nums">
                    {listing.durationMonths ? (
                        <>{listing.durationMonths} months</>
                    ) : (
                        <Dash />
                    )}
                </Td>
            )}
            {!compact && (
                <Td className="text-muted-foreground">
                    {listing.city ? listing.city : <Dash />}
                </Td>
            )}
            <Td
                compact={compact}
                className="text-muted-foreground tabular-nums"
            >
                {timeAgo(listing.createdAt)}
            </Td>
            {!compact && (
                <Td className="w-10">
                    <SaveButton listing={listing} />
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

function Dash() {
    return <span className="text-muted-foreground/60">—</span>;
}

function RowCheckbox({ listing }: { listing: ListingWithCompany }) {
    const checked = useMultiSelectStore((s) => s.selected.has(listing.id));
    const toggle = useMultiSelectStore((s) => s.toggle);

    function onChange(e: React.MouseEvent | React.ChangeEvent) {
        e.stopPropagation();
        toggle(listing);
    }

    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            onClick={(e) => e.stopPropagation()}
            aria-label={
                checked
                    ? `Unselect ${listing.title}`
                    : `Select ${listing.title}`
            }
            className="h-4 w-4 rounded border-border accent-orange-500 cursor-pointer"
        />
    );
}

function SelectAllCheckbox({ items }: { items: ListingWithCompany[] }) {
    const selected = useMultiSelectStore((s) => s.selected);
    const add = useMultiSelectStore((s) => s.add);
    const remove = useMultiSelectStore((s) => s.remove);

    const onPageSelected = items.filter((it) => selected.has(it.id)).length;
    const allOnPage = items.length > 0 && onPageSelected === items.length;
    const someOnPage = onPageSelected > 0 && !allOnPage;

    function toggleAll() {
        if (allOnPage) items.forEach((it) => remove(it.id));
        else items.forEach((it) => add(it));
    }

    return (
        <input
            type="checkbox"
            checked={allOnPage}
            ref={(el) => {
                if (el) el.indeterminate = someOnPage;
            }}
            onChange={toggleAll}
            aria-label={allOnPage ? "Unselect all" : "Select all on page"}
            className="h-4 w-4 rounded border-border accent-orange-500 cursor-pointer"
        />
    );
}

function SaveButton({ listing }: { listing: ListingWithCompany }) {
    const saved = useIsSaved(listing.id);
    const toggle = useSavedStore((s) => s.toggle);

    function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        toggle(listing);
    }

    const Icon = saved ? PiBookmarkSimpleFill : PiBookmarkSimple;

    return (
        <button
            type="button"
            aria-label={saved ? "Unsave" : "Save"}
            aria-pressed={saved}
            onClick={handleClick}
            className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md",
                "transition-colors",
                saved
                    ? "text-brand hover:bg-brand/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
        >
            <Icon className="h-4 w-4" />
        </button>
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
                className="h-7 w-7 rounded-sm object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-7 w-7 rounded-sm flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[12px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function ModeBadge({ mode }: { mode: ListingWithCompany["mode"] }) {
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
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                s.wrap,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {labels[mode]}
        </span>
    );
}

function SkeletonRows({
    compact = false,
    selectable = false,
}: {
    compact?: boolean;
    selectable?: boolean;
}) {
    const cols = (compact ? 6 : 8) + (selectable ? 1 : 0);
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
            Couldn’t load listings — {message}
        </div>
    );
}

function formatStipend(min: number | null, max: number | null): string {
    if (min && max && min !== max)
        return `₹${formatNum(min)}–${formatNum(max)}`;
    const v = max ?? min;
    return v ? `₹${formatNum(v)}` : "—";
}

function formatNum(n: number): string {
    if (n >= 100000) return `${(n / 1000).toFixed(0)}k`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return String(n);
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
