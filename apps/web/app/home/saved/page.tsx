"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingCards } from "@/src/components/listings/ListingCards";
import { useSavedStore } from "@/src/store/useSavedStore";
import { cn } from "@/src/lib/utils";

export default function SavedPage() {
    const items = useSavedStore((s) => s.items);
    const loading = useSavedStore((s) => s.loading);
    const error = useSavedStore((s) => s.error);
    const [query, setQuery] = useState("");

    const listings = useMemo(() => items.map((it) => it.listing), [items]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return listings;
        return listings.filter(
            (l) =>
                l.title.toLowerCase().includes(q) ||
                l.company.name.toLowerCase().includes(q) ||
                l.skillTagsRaw.some((s) => s.toLowerCase().includes(q)),
        );
    }, [listings, query]);

    return (
        <EmptySection
            title="Saved"
            description="Internships and jobs you've bookmarked for later."
        >
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search saved listings"
                    className={cn(
                        "w-full h-10 rounded-lg border border-border bg-card pl-9 pr-3",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
                    )}
                />
            </div>

            {/* <ListHeader
                title="Saved listings"
                count={filtered.length}
                countLabel="saved"
                loading={loading}
            /> */}

            <div className="mt-5">
                <ListingCards
                    items={filtered}
                    loading={loading}
                    error={error}
                    emptyText={
                        query
                            ? "No saved listings match your search."
                            : "Nothing saved yet — tap the bookmark on any listing to keep it here."
                    }
                />
            </div>
        </EmptySection>
    );
}
