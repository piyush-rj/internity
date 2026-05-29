"use client";

import { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import type { ApplicationStatus, JobTitle } from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { cn } from "@/src/lib/utils";
import type { ApplicationCardItem } from "@/src/components/applications/ApplicationCard";

export type ApplicationsSortKey =
    | "applied_desc"
    | "applied_asc"
    | "title_asc"
    | "company_asc";

const SORT_OPTIONS: { value: ApplicationsSortKey; label: string }[] = [
    { value: "applied_desc", label: "Most recent" },
    { value: "applied_asc", label: "Oldest" },
    { value: "title_asc", label: "Role (A–Z)" },
    { value: "company_asc", label: "Company (A–Z)" },
];

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
    { value: "APPLIED", label: "Applied" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "HIRED", label: "Hired" },
    { value: "REJECTED", label: "Rejected" },
    { value: "WITHDRAWN", label: "Withdrawn" },
];

export type ApplicationsFilters = {
    q: string;
    statuses: Set<ApplicationStatus>;
    jobTitle: JobTitle | "";
    sort: ApplicationsSortKey;
};

export function emptyApplicationsFilters(): ApplicationsFilters {
    return {
        q: "",
        statuses: new Set<ApplicationStatus>(),
        jobTitle: "",
        sort: "applied_desc",
    };
}

export function countApplicationsFilters(f: ApplicationsFilters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.statuses.size > 0) n++;
    if (f.jobTitle) n++;
    return n;
}

export function ApplicationsFilterPanel({
    filters,
    onChange,
    onApplied,
}: {
    filters: ApplicationsFilters;
    onChange: (next: ApplicationsFilters) => void;
    // Called after "Apply filters" — lets the mobile drawer close itself.
    onApplied?: () => void;
}) {
    // Search + selects are held in a draft and only take effect on "Apply
    // filters". Status checkboxes apply immediately on toggle.
    const [draft, setDraft] = useState<ApplicationsFilters>(filters);
    const activeCount = countApplicationsFilters(draft);

    function toggleStatus(s: ApplicationStatus) {
        const next = new Set(draft.statuses);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        const updated = { ...draft, statuses: next };
        setDraft(updated);
        onChange(updated);
    }
    function clearAll() {
        const empty = emptyApplicationsFilters();
        setDraft(empty);
        onChange(empty);
    }
    function apply() {
        onChange(draft);
        onApplied?.();
    }

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <Filter className="h-3.5 w-3.5 text-brand" />
                    Filters
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-brand text-white text-[10.5px] font-semibold tabular-nums">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
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
                            value={draft.q}
                            onChange={(e) =>
                                setDraft({ ...draft, q: e.target.value })
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") apply();
                            }}
                            placeholder="Role, company, or skill"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <Field label="Sort">
                    <select
                        value={draft.sort}
                        onChange={(e) =>
                            setDraft({
                                ...draft,
                                sort: e.target.value as ApplicationsSortKey,
                            })
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
                        value={draft.jobTitle}
                        onChange={(e) =>
                            setDraft({
                                ...draft,
                                jobTitle: e.target.value as JobTitle | "",
                            })
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
                                checked={draft.statuses.has(o.value)}
                                onChange={() => toggleStatus(o.value)}
                            />
                        ))}
                    </div>
                </Field>

                <button
                    type="button"
                    onClick={apply}
                    className={cn(
                        "w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg",
                        "bg-brand text-white text-[13px] font-semibold",
                        "hover:bg-brand/90 transition-colors cursor-pointer",
                    )}
                >
                    <Search className="h-3.5 w-3.5" />
                    Apply filters
                </button>
            </div>
        </section>
    );
}

export function applyApplicationsFilters(
    items: ApplicationCardItem[],
    filters: ApplicationsFilters,
): ApplicationCardItem[] {
    const q = filters.q.trim().toLowerCase();

    let arr = items.filter((a) => {
        if (filters.statuses.size > 0 && !filters.statuses.has(a.status))
            return false;
        if (filters.jobTitle && a.listing.jobTitle !== filters.jobTitle)
            return false;
        if (q) {
            const hay = [
                a.listing.title,
                a.listing.company.name,
                ...a.listing.skillTagsRaw,
            ]
                .join(" ")
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    switch (filters.sort) {
        case "applied_desc":
            arr = arr.sort(
                (a, b) =>
                    new Date(b.appliedAt).getTime() -
                    new Date(a.appliedAt).getTime(),
            );
            break;
        case "applied_asc":
            arr = arr.sort(
                (a, b) =>
                    new Date(a.appliedAt).getTime() -
                    new Date(b.appliedAt).getTime(),
            );
            break;
        case "title_asc":
            arr = arr.sort((a, b) =>
                a.listing.title.localeCompare(b.listing.title),
            );
            break;
        case "company_asc":
            arr = arr.sort((a, b) =>
                a.listing.company.name.localeCompare(b.listing.company.name),
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
