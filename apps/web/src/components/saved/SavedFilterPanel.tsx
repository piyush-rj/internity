"use client";

import { useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import type { JobTitle } from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import type { SavedItem } from "@/src/store/useSavedStore";
import { cn } from "@/src/lib/utils";

export type SavedSortKey = "saved_desc" | "saved_asc" | "title_asc";

export type SavedAppliedFilter = "any" | "not_applied" | "applied";

const SORT_OPTIONS: { value: SavedSortKey; label: string }[] = [
    { value: "saved_desc", label: "Recently saved" },
    { value: "saved_asc", label: "Oldest saved" },
    { value: "title_asc", label: "Title (A–Z)" },
];

export type SavedFilters = {
    q: string;
    jobTitle: JobTitle | "";
    applied: SavedAppliedFilter;
    sort: SavedSortKey;
};

export function emptySavedFilters(): SavedFilters {
    return { q: "", jobTitle: "", applied: "any", sort: "saved_desc" };
}

function countActive(f: SavedFilters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.jobTitle) n++;
    if (f.applied !== "any") n++;
    return n;
}

export function SavedFilterPanel({
    filters,
    onChange,
}: {
    filters: SavedFilters;
    onChange: (next: SavedFilters) => void;
}) {
    const activeCount = useMemo(() => countActive(filters), [filters]);

    function setQ(v: string) {
        onChange({ ...filters, q: v });
    }
    function setJobTitle(v: JobTitle | "") {
        onChange({ ...filters, jobTitle: v });
    }
    function setApplied(v: SavedAppliedFilter) {
        onChange({ ...filters, applied: v });
    }
    function setSort(v: SavedSortKey) {
        onChange({ ...filters, sort: v });
    }

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <Filter className="h-3.5 w-3.5 text-brand" />
                    Filters
                </div>
                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            onChange({
                                ...emptySavedFilters(),
                                sort: filters.sort,
                            })
                        }
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                )}
            </header>

            <div className="p-4 space-y-4">
                <Field label="Search">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Role, company, or skill"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <Field label="Sort">
                    <select
                        value={filters.sort}
                        onChange={(e) => setSort(e.target.value as SavedSortKey)}
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Role">
                    <select
                        value={filters.jobTitle}
                        onChange={(e) =>
                            setJobTitle(e.target.value as JobTitle | "")
                        }
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        <option value="">Any role</option>
                        {JOB_TITLES.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                        <option value="CUSTOM">Other / Custom</option>
                    </select>
                </Field>

                <Field label="Application">
                    <select
                        value={filters.applied}
                        onChange={(e) =>
                            setApplied(e.target.value as SavedAppliedFilter)
                        }
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        <option value="any">Any</option>
                        <option value="not_applied">Not applied</option>
                        <option value="applied">Applied</option>
                    </select>
                </Field>
            </div>
        </section>
    );
}

export function applySavedFilters(
    items: SavedItem[],
    filters: SavedFilters,
    appliedIds: Record<string, true>,
): SavedItem[] {
    const q = filters.q.trim().toLowerCase();

    let arr = items.filter((it) => {
        if (filters.jobTitle && it.listing.jobTitle !== filters.jobTitle)
            return false;
        if (filters.applied === "applied" && !appliedIds[it.listingId])
            return false;
        if (filters.applied === "not_applied" && appliedIds[it.listingId])
            return false;
        if (q) {
            const hay = [
                it.listing.title,
                it.listing.company.name,
                ...it.listing.skillTagsRaw,
            ]
                .join(" ")
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    switch (filters.sort) {
        case "saved_desc":
            arr = arr.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
            break;
        case "saved_asc":
            arr = arr.sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );
            break;
        case "title_asc":
            arr = arr.sort((a, b) =>
                a.listing.title.localeCompare(b.listing.title),
            );
            break;
    }
    return arr;
}

const inputCls = cn(
    "w-full h-9 rounded-lg border border-border bg-background px-3",
    "text-[12.5px] placeholder:text-muted-foreground/70",
    "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
);

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}
