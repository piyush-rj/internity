"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { MobileNavDrawer } from "@/src/components/dashboard/MobileNavDrawer";
import { ListingsFiltersPanel } from "@/src/components/listings/ListingsFiltersPanel";
import { cn } from "@/src/lib/utils";

const FILTER_PARAMS = [
    "city",
    "mode",
    "jobTitle",
    "skills",
    "stipendMin",
    "partTime",
    "applied",
] as const;

function countActiveFromParams(sp: URLSearchParams | null): number {
    if (!sp) return 0;
    let n = 0;
    for (const key of FILTER_PARAMS) {
        const v = sp.get(key);
        if (v && v.trim()) n++;
    }
    return n;
}

// mobile-only trigger that opens the filters panel inside a right-side drawer
export function ListingsFiltersMobile({ basePath }: { basePath: string }) {
    const [open, setOpen] = useState(false);
    const sp = useSearchParams();
    const activeCount = countActiveFromParams(sp);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={cn(
                    "lg:hidden inline-flex items-center justify-center gap-2",
                    "h-10 w-full rounded-lg border border-border bg-card",
                    "text-[13px] font-medium text-foreground",
                    "hover:bg-secondary/40 transition-colors cursor-pointer",
                )}
            >
                <Filter className="h-3.5 w-3.5 text-brand" />
                Filter results
                {activeCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-brand text-white text-[10.5px] font-semibold tabular-nums">
                        {activeCount}
                    </span>
                )}
            </button>

            <MobileNavDrawer
                open={open}
                onClose={() => setOpen(false)}
                ariaLabel="Listing filters"
                side="right"
                width={Math.min(
                    360,
                    typeof window !== "undefined"
                        ? window.innerWidth - 48
                        : 360,
                )}
            >
                <header className="flex items-center justify-between gap-2 h-13 px-4 border-b border-border shrink-0">
                    <div className="inline-flex items-center gap-2 text-[14px] font-semibold">
                        <Filter className="h-4 w-4 text-brand" />
                        Filter results
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close filters"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-3">
                    <ListingsFiltersPanel
                        basePath={basePath}
                        onApplied={() => setOpen(false)}
                    />
                </div>
            </MobileNavDrawer>
        </>
    );
}
