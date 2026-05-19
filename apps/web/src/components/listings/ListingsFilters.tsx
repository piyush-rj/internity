"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { WorkMode } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

type Filters = {
    q: string;
    city: string;
    mode: WorkMode | "";
    skills: string;
    stipendMin: string;
    durationMax: string;
    partTime: boolean;
};

const EMPTY: Filters = {
    q: "",
    city: "",
    mode: "",
    skills: "",
    stipendMin: "",
    durationMax: "",
    partTime: false,
};

function fromParams(sp: URLSearchParams | null): Filters {
    if (!sp) return EMPTY;
    return {
        q: sp.get("q") ?? "",
        city: sp.get("city") ?? "",
        mode: (sp.get("mode") as WorkMode | null) ?? "",
        skills: sp.get("skills") ?? "",
        stipendMin: sp.get("stipendMin") ?? "",
        durationMax: sp.get("durationMax") ?? "",
        partTime: sp.get("partTime") === "true",
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
        <section className="rounded-[20px] border border-border bg-neutral-50">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_180px_auto] gap-2 p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => set("q", e.target.value)}
                        placeholder="Search title or company…"
                        className={cn(
                            "w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        )}
                    />
                </div>
                <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="City"
                    className={cn(
                        "h-10 rounded-lg border border-border bg-background px-3",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                    )}
                />
                <select
                    value={filters.mode}
                    onChange={(e) =>
                        set("mode", e.target.value as WorkMode | "")
                    }
                    className={cn(
                        "h-10 rounded-lg border border-border bg-background px-3 pr-8",
                        "text-[13px] appearance-none",
                        "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                    )}
                >
                    <option value="">Any mode</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-site</option>
                </select>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className={cn(
                        "inline-flex items-center justify-center gap-1 h-10 px-3",
                        "rounded-lg border border-border bg-background",
                        "text-[12.5px] font-medium hover:bg-secondary/40 transition-colors",
                    )}
                >
                    More
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-brand text-white text-[10px] tabular-nums">
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
                <div className="border-t border-border p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                        type="text"
                        value={filters.skills}
                        onChange={(e) => set("skills", e.target.value)}
                        placeholder="Skills (comma-separated)"
                        className={cn(
                            "h-10 rounded-lg border border-border bg-background px-3",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        )}
                    />

                    <input
                        type="number"
                        min={0}
                        value={filters.stipendMin}
                        onChange={(e) => set("stipendMin", e.target.value)}
                        placeholder="Min stipend ₹/mo"
                        className={cn(
                            "h-10 rounded-lg border border-border bg-background px-3",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        )}
                    />
                    <input
                        type="number"
                        min={1}
                        value={filters.durationMax}
                        onChange={(e) => set("durationMax", e.target.value)}
                        placeholder="Max duration (months)"
                        className={cn(
                            "h-10 rounded-lg border border-border bg-background px-3",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        )}
                    />
                    <label
                        className={cn(
                            "inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background",
                            "text-[13px] cursor-pointer select-none",
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={filters.partTime}
                            onChange={(e) => set("partTime", e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-brand"
                        />
                        Part-time allowed
                    </label>
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
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                </div>
            )}
        </section>
    );
}
