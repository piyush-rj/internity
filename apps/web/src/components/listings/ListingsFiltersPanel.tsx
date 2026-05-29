"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import { CityCombobox } from "@/src/components/ui/CityCombobox";
import { TagsInput } from "@/src/components/ui/TagsInput";
import type { JobTitle } from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { skillSuggestions } from "@/src/lib/catalog/skills";
import { cn } from "@/src/lib/utils";

type AppliedFilter = "" | "applied" | "not_applied";

type Filters = {
    city: string;
    remote: boolean;
    jobTitle: JobTitle | "";
    // Free-text role name, only used when jobTitle === "CUSTOM". Sent as the
    // `q` param, which the server matches against title + customJobTitle.
    customJobTitle: string;
    skills: string[];
    stipendMin: string;
    partTime: boolean;
    applied: AppliedFilter;
};

const EMPTY: Filters = {
    city: "",
    remote: false,
    jobTitle: "",
    customJobTitle: "",
    skills: [],
    stipendMin: "",
    partTime: false,
    applied: "",
};

const JOB_TITLE_VALUES = new Set<JobTitle>([
    ...JOB_TITLES.map((j) => j.value),
    "CUSTOM",
]);

function fromParams(sp: URLSearchParams | null): Filters {
    if (!sp) return EMPTY;
    const jt = sp.get("jobTitle") as JobTitle | null;
    const validJt = jt && JOB_TITLE_VALUES.has(jt) ? jt : "";
    const appliedRaw = sp.get("applied");
    const applied: AppliedFilter =
        appliedRaw === "applied" || appliedRaw === "not_applied"
            ? appliedRaw
            : "";
    return {
        city: sp.get("city") ?? "",
        remote: sp.get("mode") === "REMOTE",
        jobTitle: validJt,
        customJobTitle: validJt === "CUSTOM" ? (sp.get("q") ?? "") : "",
        skills: (sp.get("skills") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        stipendMin: sp.get("stipendMin") ?? "",
        partTime: sp.get("partTime") === "true",
        applied,
    };
}

function toQueryString(f: Filters): string {
    const params = new URLSearchParams();
    if (f.city.trim()) params.set("city", f.city.trim());
    if (f.remote) params.set("mode", "REMOTE");
    if (f.jobTitle) params.set("jobTitle", f.jobTitle);
    if (f.jobTitle === "CUSTOM" && f.customJobTitle.trim()) {
        params.set("q", f.customJobTitle.trim());
    }
    if (f.skills.length > 0) params.set("skills", f.skills.join(","));
    if (f.stipendMin.trim()) params.set("stipendMin", f.stipendMin.trim());
    if (f.partTime) params.set("partTime", "true");
    if (f.applied) params.set("applied", f.applied);
    return params.toString();
}

function countActive(f: Filters): number {
    let n = 0;
    if (f.city.trim()) n++;
    if (f.remote) n++;
    if (f.jobTitle) n++;
    if (f.skills.length > 0) n++;
    if (f.stipendMin.trim()) n++;
    if (f.partTime) n++;
    if (f.applied) n++;
    return n;
}

// vertical filter sidebar for the listings browse page. Selections are held
// locally and only applied to the URL (i.e. the search runs) when the user
// clicks "Find internships" — nothing happens live as you type.
export function ListingsFiltersPanel({
    basePath,
    onApplied,
}: {
    basePath: string;
    // Called after Find applies the filters — mobile uses it to close the
    // drawer once the search has run.
    onApplied?: () => void;
}) {
    const router = useRouter();
    const sp = useSearchParams();

    const [filters, setFilters] = useState<Filters>(() => fromParams(sp));

    function set<K extends keyof Filters>(k: K, v: Filters[K]) {
        setFilters((f) => ({ ...f, [k]: v }));
    }

    function applyWith(next: Filters) {
        const qs = toQueryString(next);
        router.replace(qs ? `${basePath}?${qs}` : basePath);
    }
    function applyNow() {
        applyWith(filters);
        onApplied?.();
    }

    function clearAll() {
        setFilters(EMPTY);
        router.replace(basePath);
    }

    const activeCount = countActive(filters);

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <Filter className="h-3.5 w-3.5 text-brand" />
                    Filters
                    {activeCount > 0 && (
                        <span
                            className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-brand text-white text-[10.5px] font-semibold tabular-nums"
                            aria-label={`${activeCount} selected filters`}
                        >
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
                <Field label="Application">
                    <select
                        value={filters.applied}
                        onChange={(e) =>
                            set("applied", e.target.value as AppliedFilter)
                        }
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        <option value="">All</option>
                        <option value="not_applied">Not applied</option>
                        <option value="applied">Applied</option>
                    </select>
                </Field>

                <Field label="Job title">
                    <select
                        value={filters.jobTitle}
                        onChange={(e) =>
                            set("jobTitle", e.target.value as JobTitle | "")
                        }
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        <option value="">Any title</option>
                        {JOB_TITLES.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                        <option value="CUSTOM">Other / Custom</option>
                    </select>
                    {filters.jobTitle === "CUSTOM" && (
                        <input
                            type="text"
                            value={filters.customJobTitle}
                            onChange={(e) =>
                                set("customJobTitle", e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") applyNow();
                            }}
                            placeholder="Type the role, e.g. Robotics Intern"
                            className={cn(inputCls, "mt-2")}
                            autoFocus
                        />
                    )}
                </Field>

                <Field
                    label="Skills"
                    hint={
                        filters.jobTitle && filters.jobTitle !== "CUSTOM"
                            ? "Suggested for the picked job title — type to add your own."
                            : "Type to add, press Enter."
                    }
                >
                    <TagsInput
                        value={filters.skills}
                        onChange={(v) => set("skills", v)}
                        suggestions={skillSuggestions(filters.jobTitle || null)}
                        placeholder="React, Figma…"
                    />
                </Field>

                <Field label="Location">
                    <CityCombobox
                        value={filters.city}
                        onChange={(v) => set("city", v)}
                        placeholder="e.g. Bengaluru"
                        disabled={filters.remote}
                    />
                </Field>

                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap">
                    <CheckboxRow
                        label="Work from home"
                        checked={filters.remote}
                        onChange={(checked) => {
                            // checkboxes filter immediately
                            const next = {
                                ...filters,
                                remote: checked,
                                city: checked ? "" : filters.city,
                            };
                            setFilters(next);
                            applyWith(next);
                        }}
                    />
                    <CheckboxRow
                        label="Part-time"
                        checked={filters.partTime}
                        onChange={(checked) => {
                            const next = { ...filters, partTime: checked };
                            setFilters(next);
                            applyWith(next);
                        }}
                    />
                </div>

                <Field label="Min stipend" hint="₹ per month">
                    <input
                        type="number"
                        min={0}
                        value={filters.stipendMin}
                        onChange={(e) => set("stipendMin", e.target.value)}
                        placeholder="10000"
                        className={inputCls}
                    />
                </Field>

                <button
                    type="button"
                    onClick={applyNow}
                    className={cn(
                        "w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg",
                        "bg-brand text-white text-[13px] font-semibold",
                        "hover:bg-brand/90 transition-colors cursor-pointer",
                    )}
                >
                    <Search className="h-3.5 w-3.5" />
                    Find internships
                    {activeCount > 0 ? ` (${activeCount})` : ""}
                </button>
            </div>
        </section>
    );
}

const inputCls = cn(
    "w-full h-9 rounded-lg border border-border bg-background px-3",
    "text-[12.5px] placeholder:text-muted-foreground/70",
    "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
);

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                {hint && (
                    <span className="text-[10.5px] text-muted-foreground/70">
                        ({hint})
                    </span>
                )}
            </span>
            {children}
        </label>
    );
}

function CheckboxRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand"
            />
            {label}
        </label>
    );
}
