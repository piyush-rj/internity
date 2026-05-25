"use client";

// sticky centered day divider for chat messages
export function DayDivider({ label }: { label: string }) {
    return (
        <div className="sticky top-2 z-10 flex justify-center my-3 pointer-events-none">
            <span className="rounded-full bg-white border border-border text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium tracking-wide shadow-sm">
                {label}
            </span>
        </div>
    );
}
