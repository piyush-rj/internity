"use client";

import { use } from "react";
import Link from "next/link";
import { NavBar } from "@/src/components/navbar/NavBar";
import { ListingDetail } from "@/src/components/listings/ListingDetail";
import { useListing } from "@/src/hooks/useListing";
import { useMyApplications } from "@/src/hooks/useMyApplications";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

export default function PublicListingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { listing, loading, error } = useListing(id);
    const session = useUserSessionStore((s) => s.session);
    const { items: applications, refetch: refetchApplications } =
        useMyApplications({ enabled: !!session?.user });

    const applied = applications.some((a) => a.listingId === id);

    return (
        <div className="flex flex-col min-h-screen bg-neutral-50">
            <NavBar />
            <main className="flex-1 pt-14">
                {loading && !listing ? (
                    <DetailSkeleton />
                ) : error || !listing ? (
                    <NotFound message={error?.message ?? null} />
                ) : (
                    <ListingDetail
                        listing={listing}
                        applied={applied}
                        onApplied={refetchApplications}
                    />
                )}
            </main>
        </div>
    );
}

function NotFound({ message }: { message: string | null }) {
    return (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h1 className="text-[20px] font-semibold">Listing not found</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
                {message ??
                    "This listing may have been removed or its link is invalid."}
            </p>
            <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
                Back to home
            </Link>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 rounded-full bg-muted" />
                        <div className="h-3 w-1/3 rounded-full bg-muted" />
                        <div className="h-3 w-2/3 rounded-full bg-muted" />
                    </div>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <div className="rounded-lg border border-border bg-card p-6 space-y-2 animate-pulse">
                    <div className="h-3 w-1/4 rounded-full bg-muted" />
                    <div className="h-3 w-full rounded-full bg-muted" />
                    <div className="h-3 w-5/6 rounded-full bg-muted" />
                    <div className="h-3 w-4/6 rounded-full bg-muted" />
                </div>
                <div className="rounded-lg border border-border bg-card p-4 h-44 animate-pulse" />
            </div>
        </div>
    );
}
