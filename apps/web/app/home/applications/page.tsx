"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ApplicationCards } from "@/src/components/applications/ApplicationCards";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { useMyApplications } from "@/src/hooks/useMyApplications";
import { cn } from "@/src/lib/utils";

export default function ApplicationsPage() {
    const { items, loading, error, withdraw } = useMyApplications();
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (a) =>
                a.listing.title.toLowerCase().includes(q) ||
                a.listing.company.name.toLowerCase().includes(q) ||
                a.listing.skillTagsRaw.some((s) => s.toLowerCase().includes(q)),
        );
    }, [items, query]);

    return (
        <EmptySection
            title="Applications"
            description="Track every internship and job you've applied to."
        >
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by role, company, or skill"
                    className={cn(
                        "w-full h-10 rounded-lg border border-border bg-card pl-9 pr-3",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
                    )}
                />
            </div>
            {/* 
            <ListHeader
                title="All applications"
                count={filtered.length}
                countLabel="total"
                loading={loading}
            /> */}

            <div className="mt-5">
                <ApplicationCards
                    items={filtered}
                    loading={loading}
                    error={error}
                    onWithdraw={withdraw}
                    emptyText={
                        query
                            ? "No applications match your search."
                            : "You haven’t applied anywhere yet."
                    }
                />
            </div>
        </EmptySection>
    );
}
