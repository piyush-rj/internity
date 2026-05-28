"use client";

import { useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import type { JobTitle, WorkMode } from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { cn } from "@/src/lib/utils";
import type { MyListing } from "@/src/hooks/useMyListings";

export type MyListingsSortKey =
    | "created_desc"
    | "created_asc"
    | "applicants_desc"
    | "applicants_asc"
    | "title_asc";

export type MyListingsStatus =
    | "OPEN"
    | "PAUSED"
    | "CLOSED"
    | "EXPIRED"
    | "TAKEN_DOWN";

export type MyListingsApplicantsFilter = "any" | "with" | "without";

const SORT_OPTIONS: { value: MyListingsSortKey; label: string }[] = [
    { value: "created_desc", label: "Newest" },
    { value: "created_asc", label: "Oldest" },
    { value: "applicants_desc", label: "Most applicants" },
    { value: "applicants_asc", label: "Fewest applicants" },
    { value: "title_asc", label: "Title (A–Z)" },
];

const STATUS_OPTIONS: { value: MyListingsStatus; label: string }[] = [
    { value: "OPEN", label: "Open" },
    { value: "PAUSED", label: "Paused" },
    { value: "CLOSED", label: "Closed" },
    { value: "EXPIRED", label: "Expired" },
    { value: "TAKEN_DOWN", label: "Taken down" },
];

const MODE_OPTIONS: { value: WorkMode; label: string }[] = [
    { value: "REMOTE", label: "Remote" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "ONSITE", label: "On-site" },
];

export type MyListingsFilters = {
    q: string;
    statuses: Set<MyListingsStatus>;
    modes: Set<WorkMode>;
    jobTitle: JobTitle | "";
    applicants: MyListingsApplicantsFilter;
    sort: MyListingsSortKey;
};

export function emptyMyListingsFilters(): MyListingsFilters {
    return {
        q: "",
        statuses: new Set<MyListingsStatus>(),
        modes: new Set<WorkMode>(),
        jobTitle: "",
        applicants: "any",
        sort: "created_desc",
    };
}

function countActive(f: MyListingsFilters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.statuses.size > 0) n++;
    if (f.modes.size > 0) n++;
    if (f.jobTitle) n++;
    if (f.applicants !== "any") n++;
    return n;
}

export function MyListingsFilterPanel({
    filters,
    onChange,
}: {
    filters: MyListingsFilters;
    onChange: (next: MyListingsFilters) => void;
}) {
    const activeCount = useMemo(() => countActive(filters), [filters]);

    function setQ(v: string) {
        onChange({ ...filters, q: v });
    }
    function toggleStatus(s: MyListingsStatus) {
        const next = new Set(filters.statuses);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        onChange({ ...filters, statuses: next });
    }
    function toggleMode(m: WorkMode) {
        const next = new Set(filters.modes);
        if (next.has(m)) next.delete(m);
        else next.add(m);
        onChange({ ...filters, modes: next });
    }
    function setJobTitle(v: JobTitle | "") {
        onChange({ ...filters, jobTitle: v });
    }
    function setApplicants(v: MyListingsApplicantsFilter) {
        onChange({ ...filters, applicants: v });
    }
    function setSort(v: MyListingsSortKey) {
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
                                ...emptyMyListingsFilters(),
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
                            placeholder="Title or skill"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <Field label="Sort">
                    <select
                        value={filters.sort}
                        onChange={(e) =>
                            setSort(e.target.value as MyListingsSortKey)
                        }
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

                <Field label="Status">
                    <div className="space-y-1.5">
                        {STATUS_OPTIONS.map((o) => (
                            <CheckRow
                                key={o.value}
                                label={o.label}
                                checked={filters.statuses.has(o.value)}
                                onChange={() => toggleStatus(o.value)}
                            />
                        ))}
                    </div>
                </Field>

                <Field label="Work mode">
                    <div className="space-y-1.5">
                        {MODE_OPTIONS.map((o) => (
                            <CheckRow
                                key={o.value}
                                label={o.label}
                                checked={filters.modes.has(o.value)}
                                onChange={() => toggleMode(o.value)}
                            />
                        ))}
                    </div>
                </Field>

                <Field label="Applicants">
                    <div className="space-y-1.5">
                        <RadioRow
                            label="Any"
                            checked={filters.applicants === "any"}
                            onChange={() => setApplicants("any")}
                        />
                        <RadioRow
                            label="With applicants"
                            checked={filters.applicants === "with"}
                            onChange={() => setApplicants("with")}
                        />
                        <RadioRow
                            label="Without applicants"
                            checked={filters.applicants === "without"}
                            onChange={() => setApplicants("without")}
                        />
                    </div>
                </Field>
            </div>
        </section>
    );
}

export function applyMyListingsFilters(
    items: MyListing[],
    filters: MyListingsFilters,
): MyListing[] {
    const q = filters.q.trim().toLowerCase();

    let arr = items.filter((it) => {
        if (filters.statuses.size > 0) {
            const s = statusOf(it);
            if (!filters.statuses.has(s)) return false;
        }
        if (filters.modes.size > 0 && !filters.modes.has(it.mode)) return false;
        if (filters.jobTitle && it.jobTitle !== filters.jobTitle) return false;
        const applicants = it._count?.applications ?? 0;
        if (filters.applicants === "with" && applicants === 0) return false;
        if (filters.applicants === "without" && applicants > 0) return false;
        if (q) {
            const hay = [it.title, ...it.skillTagsRaw].join(" ").toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    switch (filters.sort) {
        case "created_desc":
            arr = arr.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
            break;
        case "created_asc":
            arr = arr.sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );
            break;
        case "applicants_desc":
            arr = arr.sort(
                (a, b) =>
                    (b._count?.applications ?? 0) -
                    (a._count?.applications ?? 0),
            );
            break;
        case "applicants_asc":
            arr = arr.sort(
                (a, b) =>
                    (a._count?.applications ?? 0) -
                    (b._count?.applications ?? 0),
            );
            break;
        case "title_asc":
            arr = arr.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    return arr;
}

function statusOf(it: MyListing): MyListingsStatus {
    if (it.takenDownAt) return "TAKEN_DOWN";
    if (it.closedAt) return "CLOSED";
    if (it.expiresAt && new Date(it.expiresAt).getTime() <= Date.now())
        return "EXPIRED";
    if (it.pausedAt) return "PAUSED";
    return "OPEN";
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

function CheckRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-3.5 w-3.5 accent-brand"
            />
            {label}
        </label>
    );
}

function RadioRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="group flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
            <input
                type="radio"
                checked={checked}
                onChange={onChange}
                className="peer sr-only"
            />
            <span
                aria-hidden
                className={
                    "relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors " +
                    (checked
                        ? "border-brand"
                        : "border-border group-hover:border-foreground/40") +
                    " peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-1"
                }
            >
                <span
                    className={
                        "h-2 w-2 rounded-full bg-brand transition-transform " +
                        (checked ? "scale-100" : "scale-0")
                    }
                />
            </span>
            {label}
        </label>
    );
}
