"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useMyListings } from "@/src/hooks/useMyListings";
import { cn } from "@/src/lib/utils";

// dashboard banner warning founders about expired or expiring listings
export function ListingLifecycleBanner() {
    const { items, loading } = useMyListings();
    if (loading) return null;

    const now = Date.now();
    const SOON_MS = 3 * 24 * 60 * 60 * 1000;

    const visible = items.filter(
        (it) => !it.takenDownAt && !it.closedAt && it.expiresAt,
    );
    const expired = visible.filter(
        (it) => new Date(it.expiresAt!).getTime() <= now,
    );
    const expiring = visible.filter((it) => {
        const t = new Date(it.expiresAt!).getTime();
        return t > now && t - now <= SOON_MS;
    });

    if (expired.length === 0 && expiring.length === 0) return null;

    return (
        <div
            className={cn(
                "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3",
                "flex items-start gap-2.5",
            )}
            role="status"
        >
            <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[12.5px] font-medium text-amber-900">
                    {expired.length > 0 && (
                        <>
                            {expired.length}{" "}
                            {expired.length === 1
                                ? "listing has expired"
                                : "listings have expired"}
                        </>
                    )}
                    {expired.length > 0 && expiring.length > 0 ? " · " : ""}
                    {expiring.length > 0 && (
                        <>
                            {expiring.length}{" "}
                            {expiring.length === 1
                                ? "listing expires soon"
                                : "listings expire soon"}
                        </>
                    )}
                </div>
                <p className="text-[11.5px] text-amber-900/90 leading-snug">
                    Renew to keep them visible to students for another 30 days.
                </p>
                <Link
                    href="/home/manage-listings"
                    className="inline-block mt-1 text-[11.5px] font-medium text-amber-900 underline-offset-2 hover:underline"
                >
                    Open My listings →
                </Link>
            </div>
        </div>
    );
}
