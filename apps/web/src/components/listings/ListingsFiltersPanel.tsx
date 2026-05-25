"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import { CityCombobox } from "@/src/components/ui/CityCombobox";
import type { CompanySize } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

type Filters = {
    q: string;
    city: string;
    remote: boolean;
    skills: string;
    stipendMin: string;
    durationMax: string;
    partTime: boolean;
    companySize: CompanySize | "";
};

const EMPTY: Filters = {
    q: "",
    city: "",
    remote: false,
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
        remote: sp.get("mode") === "REMOTE",
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
    if (f.remote) params.set("mode", "REMOTE");
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
    if (f.remote) n++;
    if (f.skills.trim()) n++;
    if (f.stipendMin.trim()) n++;
    if (f.durationMax.trim()) n++;
    if (f.partTime) n++;
    if (f.companySize) n++;
    return n;
}

// vertical filter sidebar for internships and jobs pages
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
                <Field label="Search">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(e) => set("q", e.target.value)}
                            placeholder="Role, company, or skill"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <Field label="Skills" hint="Comma-separated">
                    <input
                        type="text"
                        value={filters.skills}
                        onChange={(e) => set("skills", e.target.value)}
                        placeholder="React, Figma"
                        className={inputCls}
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

                <div className="space-y-2">
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

                <Field label="Company size">
                    <select
                        value={filters.companySize}
                        onChange={(e) =>
                            set(
                                "companySize",
                                e.target.value as CompanySize | "",
                            )
                        }
                        className={cn(inputCls, "appearance-none pr-8 cursor-pointer")}
                    >
                        <option value="">Any size</option>
                        {COMPANY_SIZE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
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
