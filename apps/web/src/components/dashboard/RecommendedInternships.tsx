"use client";

import { useMemo } from "react";
import { ListingList } from "@/src/components/listings/ListingList";
import { useListings } from "@/src/hooks/useListings";
import { useMeStore } from "@/src/store/useMeStore";
import { recommendedJobTitles } from "@/src/lib/catalog/recommendations";
import type { JobTitle } from "@/src/lib/api";

export function RecommendedInternships() {
    const interested = useMeStore((s) => s.me?.interestedJobTitles);

    // Roles to recommend, in priority order. Empty when the student picked no
    // interested roles — we then fall back to a generic recent-listings view.
    const recommended = useMemo(
        () => recommendedJobTitles(interested ?? []),
        [interested],
    );
    const personalized = recommended.length > 0;

    // When personalized, over-fetch then re-rank by recommendation priority
    // before trimming to the four shown.
    const { items, loading, error } = useListings(
        personalized
            ? { jobTitles: recommended.join(","), pageSize: 12 }
            : { pageSize: 4 },
    );

    const ranked = useMemo(() => {
        if (!personalized) return items.slice(0, 4);
        const priority = new Map(recommended.map((t, i) => [t, i]));
        const rank = (t: JobTitle | null) =>
            t != null
                ? (priority.get(t) ?? Number.MAX_SAFE_INTEGER)
                : Number.MAX_SAFE_INTEGER;
        return [...items]
            .sort((a, b) => rank(a.jobTitle) - rank(b.jobTitle))
            .slice(0, 4);
    }, [items, recommended, personalized]);

    return (
        <ListingList
            items={ranked}
            loading={loading}
            error={error}
            compact
            emptyText={
                personalized
                    ? "No matching internships for your interests yet. Check back soon."
                    : "No open internships right now. Check back tomorrow."
            }
        />
    );
}
