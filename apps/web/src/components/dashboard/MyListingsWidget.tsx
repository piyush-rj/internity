"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
    PiBriefcase,
    PiCalendar,
    PiCheckCircle,
    PiUsers,
} from "react-icons/pi";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { useMyListings, type MyListing } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

export function MyListingsWidget() {
    const { items, loading, error } = useMyListings();
    const top = items.slice(0, 4);

    return (
        <div className="space-y-4">
            <ListHeader
                title="My listings"
                count={items.length}
                countLabel="posted"
                loading={loading}
                action={
                    <Link
                        href="/home/manage-listings"
                        className="text-neutral-600 text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        view all listings
                    </Link>
                }
            />

            <section className="rounded-md border border-border bg-card/90 backdrop-blur-sm shadow-xs overflow-hidden transition-shadow duration-200">
                {error ? (
                    <ErrorRow message={error.message} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-neutral-100 border-b border-border">
                                <tr className="text-left text-muted-foreground divide-x divide-border">
                                    <ColHeader
                                        icon={
                                            <PiBriefcase className="h-3.5 w-3.5" />
                                        }
                                    >
                                        Role
                                    </ColHeader>
                                    <ColHeader
                                        icon={
                                            <PiCheckCircle className="h-3.5 w-3.5" />
                                        }
                                    >
                                        Status
                                    </ColHeader>
                                    <ColHeader
                                        icon={
                                            <PiUsers className="h-3.5 w-3.5" />
                                        }
                                    >
                                        Applicants
                                    </ColHeader>
                                    <ColHeader
                                        icon={
                                            <PiCalendar className="h-3.5 w-3.5" />
                                        }
                                    >
                                        Posted
                                    </ColHeader>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <SkeletonRows />
                                ) : top.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-10 text-center"
                                        >
                                            <EmptyContent />
                                        </td>
                                    </tr>
                                ) : (
                                    top.map((listing) => (
                                        <ListingRow
                                            key={listing.id}
                                            listing={listing}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function ColHeader({
    icon,
    children,
}: {
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <th className="px-4 py-2.5 font-medium text-[12px] uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5">
                {icon}
                {children}
            </span>
        </th>
    );
}

function ListingRow({ listing }: { listing: MyListing }) {
    const closed = !!listing.closedAt;
    return (
        <tr className="group hover:bg-secondary/40 transition-colors divide-x divide-border">
            <Td className="min-w-50">
                <Link
                    href={`/home/applicants?listingId=${listing.id}`}
                    className="flex items-center gap-2.5"
                >
                    <span
                        className={cn(
                            "h-7 w-7 rounded-sm flex items-center justify-center shrink-0",
                            "bg-secondary text-foreground text-[12px] font-semibold ring-1 ring-border",
                        )}
                    >
                        {listing.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-foreground truncate group-hover:text-orange-600 transition-colors duration-200">
                        {listing.title}
                    </span>
                </Link>
            </Td>
            <Td>
                <StatusBadge closed={closed} />
            </Td>
            <Td className="text-muted-foreground tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                    <PiUsers className="h-3 w-3" />
                    {listing._count?.applications ?? 0}
                </span>
            </Td>
            <Td className="text-muted-foreground tabular-nums">
                {timeAgo(listing.createdAt)}
            </Td>
            <Td className="w-10">
                <Link
                    href={`/home/applicants?listingId=${listing.id}`}
                    aria-label="View applicants"
                    className={cn(
                        "h-8 w-8 inline-flex items-center justify-center rounded-md",
                        "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        "transition-colors",
                    )}
                >
                    →
                </Link>
            </Td>
        </tr>
    );
}

function Td({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <td
            className={cn(
                "px-4 py-3 align-middle whitespace-nowrap",
                className,
            )}
        >
            {children}
        </td>
    );
}

function StatusBadge({ closed }: { closed: boolean }) {
    const styles = closed
        ? {
              wrap: "bg-zinc-50 text-zinc-600 border-zinc-200",
              dot: "bg-zinc-400",
          }
        : {
              wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
              dot: "bg-emerald-500",
          };
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                styles.wrap,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
            {closed ? "Closed" : "Open"}
        </span>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse divide-x divide-border">
                    {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-3 rounded-full bg-muted" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function EmptyContent() {
    return (
        <div>
            <p className="text-[13px] text-muted-foreground">
                You haven’t posted anything yet.
            </p>
            <Link
                href="/home/manage-listings/new"
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-orange-600 hover:underline"
            >
                <Plus className="h-3 w-3" />
                Post your first listing
            </Link>
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn’t load listings — {message}
        </div>
    );
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
