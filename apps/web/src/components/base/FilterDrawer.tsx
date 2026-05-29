"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { MobileNavDrawer } from "@/src/components/dashboard/MobileNavDrawer";
import { cn } from "@/src/lib/utils";

// Mobile-only "Filters" button that slides a filter panel in from the right.
// Pass a render function for `children` so the panel can close the drawer once
// the user applies (e.g. after the "Apply filters" / "Find" button).
export function FilterDrawer({
    activeCount = 0,
    children,
}: {
    activeCount?: number;
    children: (close: () => void) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

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
                onClose={close}
                ariaLabel="Filters"
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
                        Filters
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close filters"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-3">
                    {children(close)}
                </div>
            </MobileNavDrawer>
        </>
    );
}
