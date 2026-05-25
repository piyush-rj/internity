"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { CityCombobox } from "@/src/components/ui/CityCombobox";
import type { CompanySize, WorkMode } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

type Filters = {
    q: string;
    city: string;
    mode: WorkMode | "";
    skills: string;
    stipendMin: string;
    durationMax: string;
    partTime: boolean;
    companySize: CompanySize | "";
};

const EMPTY: Filters = {
    q: "",
    city: "",
    mode: "",
    skills: "",
    stipendMin: "",
    durationMax: "",
    partTime: false,
    companySize: "",
};

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
    { value: "1-10", label: "1–10 (Startup)" },
    { value: "11-50", label: "11–50 (Small)" },
    { value: "51-200", label: "51–200 (Mid)" },
    { value: "201-500", label: "201–500 (Large)" },
    { value: "500+", label: "500+ (Enterprise)" },
];

function fromParams(sp: URLSearchParams | null): Filters {
    if (!sp) return EMPTY;
    const size = sp.get("companySize");
    const validSize = COMPANY_SIZE_OPTIONS.some((o) => o.value === size)
        ? (size as CompanySize)
        : "";
    return {
        q: sp.get("q") ?? "",
        city: sp.get("city") ?? "",
        mode: (sp.get("mode") as WorkMode | null) ?? "",
        skills: sp.get("skills") ?? "",
        stipendMin: sp.get("stipendMin") ?? "",
        durationMax: sp.get("durationMax") ?? "",
        partTime: sp.get("partTime") === "true",
        companySize: validSize,
    };
}

function toQueryString(f: Filters): string {
    const params = new URLSearchParams();
    if (f.q.trim()) params.set("q", f.q.trim());
    if (f.city.trim()) params.set("city", f.city.trim());
    if (f.mode) params.set("mode", f.mode);
    if (f.skills.trim()) params.set("skills", f.skills.trim());
    if (f.stipendMin.trim()) params.set("stipendMin", f.stipendMin.trim());
    if (f.durationMax.trim()) params.set("durationMax", f.durationMax.trim());
    if (f.partTime) params.set("partTime", "true");
    if (f.companySize) params.set("companySize", f.companySize);
    return params.toString();
}

function countActive(f: Filters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.city.trim()) n++;
    if (f.mode) n++;
    if (f.skills.trim()) n++;
    if (f.stipendMin.trim()) n++;
    if (f.durationMax.trim()) n++;
    if (f.partTime) n++;
    if (f.companySize) n++;
    return n;
}

export function ListingsFilters({ basePath }: { basePath: string }) {
    const router = useRouter();
    const sp = useSearchParams();

    const [filters, setFilters] = useState<Filters>(() => fromParams(sp));
    const [expanded, setExpanded] = useState<boolean>(false);
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_180px_auto] gap-2 p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => set("q", e.target.value)}
                        placeholder="Search role, company, or skill"
                        className={cn(
                            "w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-orange-500/15",
                        )}
                    />
                </div>
                <CityCombobox
                    value={filters.city}
                    onChange={(v) => set("city", v)}
                    placeholder="City, e.g. Bengaluru"
                />
                <select
                    value={filters.mode}
                    onChange={(e) =>
                        set("mode", e.target.value as WorkMode | "")
                    }
                    className={cn(
                        "h-10 rounded-lg border border-border bg-background px-3 pr-8",
                        "text-[13px] appearance-none cursor-pointer",
                        "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-orange-500/15",
                    )}
                >
                    <option value="">Any work mode</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-site</option>
                </select>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className={cn(
                        "inline-flex items-center justify-center gap-1.5 h-10 px-3",
                        "rounded-lg border border-border bg-background",
                        "text-[12.5px] font-medium hover:bg-secondary/40 transition-colors cursor-pointer",
                    )}
                >
                    More filters
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[10px] tabular-nums">
                            {activeCount}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            {expanded && (
                <div className="border-t border-border bg-secondary/30 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FilterField label="Skills" hint="Comma-separated">
                        <input
                            type="text"
                            value={filters.skills}
                            onChange={(e) => set("skills", e.target.value)}
                            placeholder="React, TypeScript, Figma"
                            className={fieldInputCls}
                        />
                    </FilterField>

                    <FilterField label="Min stipend" hint="₹ per month">
                        <input
                            type="number"
                            min={0}
                            value={filters.stipendMin}
                            onChange={(e) => set("stipendMin", e.target.value)}
                            placeholder="10000"
                            className={fieldInputCls}
                        />
                    </FilterField>

                    <FilterField label="Max duration" hint="Months">
                        <input
                            type="number"
                            min={1}
                            value={filters.durationMax}
                            onChange={(e) => set("durationMax", e.target.value)}
                            placeholder="3"
                            className={fieldInputCls}
                        />
                    </FilterField>

                    <FilterField label="Company size">
                        <select
                            value={filters.companySize}
                            onChange={(e) =>
                                set(
                                    "companySize",
                                    e.target.value as CompanySize | "",
                                )
                            }
                            className={cn(
                                fieldInputCls,
                                "appearance-none pr-8 cursor-pointer",
                            )}
                        >
                            <option value="">Any size</option>
                            {COMPANY_SIZE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </FilterField>

                    <FilterField label="Part-time">
                        <label
                            className={cn(
                                "inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background",
                                "text-[13px] cursor-pointer select-none",
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={filters.partTime}
                                onChange={(e) =>
                                    set("partTime", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-border accent-orange-500"
                            />
                            Allow part-time roles
                        </label>
                    </FilterField>
                </div>
            )}

            {activeCount > 0 && (
                <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-3">
                    <span className="text-[11.5px] text-muted-foreground">
                        {activeCount} {activeCount === 1 ? "filter" : "filters"}{" "}
                        active
                    </span>
                    <button
                        type="button"
                        onClick={() => setFilters(EMPTY)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                </div>
            )}
        </section>
    );
}

const fieldInputCls = cn(
    "w-full h-10 rounded-lg border border-border bg-background px-3",
    "text-[13px] placeholder:text-muted-foreground/70",
    "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-orange-500/15",
);

function FilterField({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1">
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
