"use client";

import { cn } from "@/src/lib/utils";

/**
 * Placeholder bubbles shown while the message history is loading. Alternating
 * sides + varied widths so it reads as a real conversation rather than a flat
 * loading bar.
 */
const ROWS: { side: "left" | "right"; width: string }[] = [
    { side: "left", width: "w-32" },
    { side: "right", width: "w-40" },
    { side: "left", width: "w-48" },
    { side: "right", width: "w-24" },
    { side: "left", width: "w-36" },
    { side: "right", width: "w-44" },
];

export function MessagesSkeleton() {
    return (
        <div className="space-y-2 py-2" aria-hidden>
            {ROWS.map((r, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex",
                        r.side === "right" ? "justify-end" : "justify-start",
                    )}
                >
                    <div
                        className={cn(
                            "h-7 rounded-md animate-pulse",
                            r.side === "right"
                                ? "bg-brand/20"
                                : "bg-neutral-200",
                            r.width,
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
