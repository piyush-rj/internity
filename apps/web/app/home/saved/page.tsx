"use client";

import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { ListingList } from "@/src/components/listings/ListingList";
import { useSavedStore } from "@/src/store/useSavedStore";

export default function SavedPage() {
    const items = useSavedStore((s) => s.items);
    const loading = useSavedStore((s) => s.loading);
    const error = useSavedStore((s) => s.error);

    return (
        <EmptySection
            title="Saved"
            description="Internships and jobs you've bookmarked for later."
        >
            <ListHeader
                title="Saved listings"
                count={items.length}
                countLabel="saved"
                loading={loading}
            />

            <div className="mt-5">
                <ListingList
                    items={items.map((it) => it.listing)}
                    loading={loading}
                    error={error}
                    emptyText="Nothing saved yet — tap the bookmark on any listing to keep it here."
                />
            </div>
        </EmptySection>
    );
}
