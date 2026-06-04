"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingCards } from "@/src/components/listings/ListingCards";
import { ListingsFiltersMobile } from "@/src/components/listings/ListingsFiltersMobile";
import { ListingsFiltersPanel } from "@/src/components/listings/ListingsFiltersPanel";
import { MultiApplyBar } from "@/src/components/listings/MultiApplyBar";
import { PaginationBar } from "@/src/components/listings/PaginationBar";
import {
    filtersFromSearchParams,
    PAGE_SIZE,
} from "@/src/components/listings/filtersFromSearchParams";
import { useListings } from "@/src/hooks/useListings";
import { useAppliedStore } from "@/src/store/useAppliedStore";
import { useMultiSelectStore } from "@/src/store/useMultiSelectStore";
import type { ListingWithCompany } from "@/src/lib/api";
import { useMe } from "@/src/hooks/useMe";

export default function InternshipsPage() {
    return (
        <Suspense fallback={null}>
            <InternshipsView />
        </Suspense>
    );
}

function InternshipsView() {
    const sp = useSearchParams();
    const filters = filtersFromSearchParams(sp);
    const { items, total, page, pageSize, loading, error } =
        useListings(filters);

    // Applied/Not-applied is a client-side post-filter because the server
    // doesn't know who applied to what for browse queries.
    const appliedMode = sp?.get("applied") ?? "";
    const appliedIds = useAppliedStore((s) => s.appliedIds);
    const visibleItems = useMemo(() => {
        if (appliedMode === "applied") {
            return items.filter((l) => appliedIds[l.id]);
        }
        if (appliedMode === "not_applied") {
            return items.filter((l) => !appliedIds[l.id]);
        }
        return items;
    }, [items, appliedMode, appliedIds]);

    return (
        <EmptySection
            title="Internships"
            description="Browse open internships across India."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-5">
                    <ListingsFiltersMobile basePath="/home/internships" />
                    <SelectAllBar items={visibleItems} />
                    <ListingCards
                        items={visibleItems}
                        loading={loading}
                        error={error}
                        emptyText="No internships match these filters. Try widening your search."
                        from="internships"
                    />
                    <PaginationBar
                        basePath="/home/internships"
                        page={page}
                        pageSize={pageSize ?? PAGE_SIZE}
                        total={total}
                    />
                </div>
                <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                    <ListingsFiltersPanel basePath="/home/internships" />
                </aside>
            </div>
            <MultiApplyBar />
        </EmptySection>
    );
}

function SelectAllBar({ items }: { items: ListingWithCompany[] }) {
    const { me } = useMe();
    const selected = useMultiSelectStore((s) => s.selected);
    const add = useMultiSelectStore((s) => s.add);
    const clear = useMultiSelectStore((s) => s.clear);

    if (!me || me.role !== "STUDENT" || items.length === 0) return null;

    const selectedCount = items.filter((l) => selected.has(l.id)).length;
    const allSelected = selectedCount === items.length;
    const someSelected = selectedCount > 0 && !allSelected;

    function toggle() {
        if (allSelected) {
            clear();
        } else {
            items.forEach((l) => add(l));
        }
    }

    return (
        <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggle}
                    className="h-4 w-4 rounded border-border accent-foreground cursor-pointer"
                />
                <span className="text-[12.5px] text-muted-foreground">
                    {allSelected
                        ? "Deselect all"
                        : someSelected
                          ? `${selectedCount} selected`
                          : "Select all"}
                </span>
            </label>
        </div>
    );
}
