"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { MobileNavDrawer } from "@/src/components/dashboard/MobileNavDrawer";
import {
    MyListingsFilterPanel,
    countActive,
    type MyListingsFilters,
} from "@/src/components/manage-listings/MyListingsFilterPanel";
import { cn } from "@/src/lib/utils";

// Mobile-only trigger that opens the "My listings" filter panel in a right-side
// drawer — mirrors the internships browse page. Same controlled filters; no
// behaviour change, just where the panel lives on small screens.
export function MyListingsFiltersMobile({
    filters,
    onChange,
}: {
    filters: MyListingsFilters;
    onChange: (next: MyListingsFilters) => void;
}) {
    const [open, setOpen] = useState(false);
    const activeCount = countActive(filters);

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
                Filters
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
                <div className="flex items-center justify-end h-13 px-3 border-b border-border shrink-0">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close filters"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    <MyListingsFilterPanel
                        filters={filters}
                        onChange={onChange}
                        onApplied={() => setOpen(false)}
                    />
                </div>
            </MobileNavDrawer>
        </>
    );
}
