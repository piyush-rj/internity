"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { MyListingCard } from "@/src/components/manage-listings/MyListingCard";
import { useMyListings } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

export default function ManageListingsPage() {
    const {
        items,
        loading,
        error,
        close,
        reopen,
        renew,
        pause,
        unpause,
        remove,
    } = useMyListings();

    const openCount = items.filter((it) => !it.closedAt).length;

    return (
        <EmptySection
            title="My listings"
            description="Internships and jobs you’ve posted across your company."
        >
            <div className="space-y-3">
                <header className="flex items-center justify-between gap-3 px-1">
                    <div className="text-[13px] font-medium">All listings</div>
                    {!loading && items.length > 0 && (
                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {openCount} open · {items.length} total
                        </span>
                    )}
                </header>

                {error ? (
                    <ErrorRow message={error.message} />
                ) : loading ? (
                    <Skeleton />
                ) : items.length === 0 ? (
                    <Empty />
                ) : (
                    <ul className="space-y-3">
                        {items.map((listing) => (
                            <li key={listing.id}>
                                <MyListingCard
                                    listing={listing}
                                    onClose={close}
                                    onReopen={reopen}
                                    onRenew={renew}
                                    onPause={pause}
                                    onUnpause={unpause}
                                    onRemove={remove}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </EmptySection>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3"
                >
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="flex gap-1.5">
                        <div className="h-5 w-16 rounded bg-muted" />
                        <div className="h-5 w-14 rounded bg-muted" />
                        <div className="h-5 w-12 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Empty() {
    return (
        <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-5 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
                You haven’t posted anything yet.
            </p>
            <Link
                href="/home/manage-listings/new"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                <Plus className="h-3 w-3" />
                Post your first listing
            </Link>
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div
            className={cn(
                "rounded-lg border border-destructive/30 bg-destructive/5",
                "px-3 py-2.5 text-[12.5px] text-destructive",
            )}
        >
            Couldn’t load listings — {message}
        </div>
    );
}
