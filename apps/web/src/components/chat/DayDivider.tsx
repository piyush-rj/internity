"use client";

/**
 * Centered day label that sticks to the top of the scroll viewport while its
 * group's messages are visible. As messages from one day scroll past, the
 * next group's divider naturally takes over the top slot.
 */
export function DayDivider({ label }: { label: string }) {
    return (
        <div className="sticky top-2 z-10 flex justify-center my-3 pointer-events-none">
            <span className="rounded-full bg-white border border-border text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium tracking-wide shadow-sm">
                {label}
            </span>
        </div>
    );
}
