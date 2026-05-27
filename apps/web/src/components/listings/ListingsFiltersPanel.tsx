"use client";

import { useEffect, useRef, useState } from "react";
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
    q: string;
    city: string;
    remote: boolean;
    jobTitle: JobTitle | "";
    skills: string[];
    stipendMin: string;
    durationMax: string;
    partTime: boolean;
    applied: AppliedFilter;
};

const EMPTY: Filters = {
    q: "",
    city: "",
    remote: false,
    jobTitle: "",
    skills: [],
    stipendMin: "",
    durationMax: "",
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
        q: sp.get("q") ?? "",
        city: sp.get("city") ?? "",
        remote: sp.get("mode") === "REMOTE",
        jobTitle: validJt,
        skills: (sp.get("skills") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        stipendMin: sp.get("stipendMin") ?? "",
        durationMax: sp.get("durationMax") ?? "",
        partTime: sp.get("partTime") === "true",
        applied,
    };
}

function toQueryString(f: Filters): string {
    const params = new URLSearchParams();
    if (f.q.trim()) params.set("q", f.q.trim());
    if (f.city.trim()) params.set("city", f.city.trim());
    if (f.remote) params.set("mode", "REMOTE");
    if (f.jobTitle) params.set("jobTitle", f.jobTitle);
    if (f.skills.length > 0) params.set("skills", f.skills.join(","));
    if (f.stipendMin.trim()) params.set("stipendMin", f.stipendMin.trim());
    if (f.durationMax.trim()) params.set("durationMax", f.durationMax.trim());
    if (f.partTime) params.set("partTime", "true");
    if (f.applied) params.set("applied", f.applied);
    return params.toString();
}

function countActive(f: Filters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.city.trim()) n++;
    if (f.remote) n++;
    if (f.jobTitle) n++;
    if (f.skills.length > 0) n++;
    if (f.stipendMin.trim()) n++;
    if (f.durationMax.trim()) n++;
    if (f.partTime) n++;
    if (f.applied) n++;
    return n;
}

// vertical filter sidebar for the listings browse page
export function ListingsFiltersPanel({ basePath }: { basePath: string }) {
    const router = useRouter();
    const sp = useSearchParams();

    const [filters, setFilters] = useState<Filters>(() => fromParams(sp));
    const firstRun = useRef<boolean>(true);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const handle = setTimeout(() => {
            const qs = toQueryString(filters);
            router.replace(qs ? `${basePath}?${qs}` : basePath);
        }, 300);
        return () => clearTimeout(handle);
    }, [filters, basePath, router]);

    function set<K extends keyof Filters>(k: K, v: Filters[K]) {
        setFilters((f) => ({ ...f, [k]: v }));
    }

    const activeCount = countActive(filters);

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
                        onClick={() => setFilters(EMPTY)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                )}
            </header>

            <div className="p-4 space-y-4">
                <Field label="Search title">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(e) => set("q", e.target.value)}
                            placeholder="Frontend Intern, Acme…"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <Field label="Application">
                    <select
                        value={filters.applied}
                        onChange={(e) =>
                            set(
                                "applied",
                                e.target.value as AppliedFilter,
                            )
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
                            set(
                                "jobTitle",
                                e.target.value as JobTitle | "",
                            )
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
                        suggestions={skillSuggestions(
                            filters.jobTitle || null,
                        )}
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
                            set("remote", checked);
                            if (checked) set("city", "");
                        }}
                    />
                    <CheckboxRow
                        label="Part-time"
                        checked={filters.partTime}
                        onChange={(checked) => set("partTime", checked)}
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

                <Field label="Max duration" hint="Months">
                    <input
                        type="number"
                        min={1}
                        value={filters.durationMax}
                        onChange={(e) => set("durationMax", e.target.value)}
                        placeholder="3"
                        className={inputCls}
                    />
                </Field>
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
