"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { MyListingCard } from "@/src/components/manage-listings/MyListingCard";
import { useMyListings } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

export default function ManageListingsPage() {
    const { items, loading, error, close, reopen, remove } = useMyListings();

    const openCount = items.filter((it) => !it.closedAt).length;

    return (
        <EmptySection
            title="My listings"
            description="Internships and jobs you’ve posted across your company."
        >
            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                    <div className="text-[13px] font-medium">All listings</div>
                    {!loading && (
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
                    <ul className="divide-y divide-border">
                        {items.map((listing) => (
                            <li key={listing.id}>
                                <MyListingCard
                                    listing={listing}
                                    onClose={close}
                                    onReopen={reopen}
                                    onRemove={remove}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </EmptySection>
    );
}

function Skeleton() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-start gap-4 px-5 py-4 animate-pulse"
                >
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                    <div className="h-8 w-16 rounded-md bg-muted" />
                </li>
            ))}
        </ul>
    );
}

function Empty() {
    return (
        <div className="px-5 py-12 text-center">
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
                "mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5",
                "px-3 py-2.5 text-[12.5px] text-destructive",
            )}
        >
            Couldn’t load listings — {message}
        </div>
    );
}
