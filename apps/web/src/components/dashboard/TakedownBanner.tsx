"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useMyListings } from "@/src/hooks/useMyListings";
import { useMeStore } from "@/src/store/useMeStore";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { cn } from "@/src/lib/utils";

// banner warning founders about admin-taken-down listings. mounts the
// useMyListings hook only for employers so students don't trigger /listing/mine
export function TakedownBanner() {
    const role = useMeStore((s) => s.me?.role);
    if (role !== "EMPLOYER") return null;
    return <TakedownBannerInner />;
}

function TakedownBannerInner() {
    const { items, loading } = useMyListings();
    if (loading) return null;

    const takenDown = items.filter((it) => it.takenDownAt);
    if (takenDown.length === 0) return null;

    return (
        <div
            className={cn(
                "rounded-lg border border-red-200 bg-red-50 px-4 py-3",
                "flex items-start gap-2.5",
            )}
            role="alert"
        >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-700" />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[12.5px] font-medium text-red-900">
                    {takenDown.length === 1
                        ? "1 listing was removed by admin"
                        : `${takenDown.length} listings were removed by admin`}
                </div>
                <ul className="space-y-0.5 text-[11.5px] text-red-900/90 leading-snug">
                    {takenDown.slice(0, 3).map((l) => (
                        <li key={l.id} className="truncate">
                            <span className="font-medium">
                                {formatListingTitle(l.title)}
                            </span>
                            {l.takedownReason ? ` — ${l.takedownReason}` : ""}
                        </li>
                    ))}
                    {takenDown.length > 3 && (
                        <li className="text-red-900/70">
                            +{takenDown.length - 3} more in My listings
                        </li>
                    )}
                </ul>
                <Link
                    href="/home/manage-listings"
                    className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-red-800 underline-offset-2 hover:underline"
                >
                    Open My listings
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
