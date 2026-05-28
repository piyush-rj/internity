"use client";

import { useMemo, useState } from "react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingCards } from "@/src/components/listings/ListingCards";
import {
    SavedFilterPanel,
    applySavedFilters,
    emptySavedFilters,
    type SavedFilters,
} from "@/src/components/saved/SavedFilterPanel";
import { useAppliedStore } from "@/src/store/useAppliedStore";
import { useSavedStore } from "@/src/store/useSavedStore";

export default function SavedPage() {
    const items = useSavedStore((s) => s.items);
    const loading = useSavedStore((s) => s.loading);
    const error = useSavedStore((s) => s.error);
    const appliedIds = useAppliedStore((s) => s.appliedIds);
    const [filters, setFilters] = useState<SavedFilters>(emptySavedFilters);

    const filteredListings = useMemo(
        () =>
            applySavedFilters(items, filters, appliedIds).map(
                (it) => it.listing,
            ),
        [items, filters, appliedIds],
    );

    const hasActiveFilters =
        filters.q.trim().length > 0 ||
        filters.jobTitle !== "" ||
        filters.applied !== "any";

    return (
        <EmptySection
            title="Saved"
            description="Internships and jobs you've bookmarked for later."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0">
                    <ListingCards
                        items={filteredListings}
                        loading={loading}
                        error={error}
                        emptyText={
                            hasActiveFilters
                                ? "No saved listings match these filters."
                                : "Nothing saved yet — tap the bookmark on any listing to keep it here."
                        }
                    />
                </div>
                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <SavedFilterPanel filters={filters} onChange={setFilters} />
                </aside>
            </div>
        </EmptySection>
    );
}
