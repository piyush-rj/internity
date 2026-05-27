// Centralized formatter for a listing's duration. A listing stores either
// a months count OR a weeks count (the post-listing picker only ever
// writes to one); the renderer picks whichever is set so we don't lie to
// students about "0 months" when the founder actually said "3 weeks".

export function formatDuration(
    months: number | null | undefined,
    weeks: number | null | undefined,
): string | null {
    if (typeof months === "number" && months > 0) {
        return `${months} month${months === 1 ? "" : "s"}`;
    }
    if (typeof weeks === "number" && weeks > 0) {
        return `${weeks} week${weeks === 1 ? "" : "s"}`;
    }
    return null;
}

// Same data, with the unit suffix tightened for compact card layouts
// (e.g. "3 mo" / "6 wk").
export function formatDurationCompact(
    months: number | null | undefined,
    weeks: number | null | undefined,
): string | null {
    if (typeof months === "number" && months > 0) return `${months} mo`;
    if (typeof weeks === "number" && weeks > 0) return `${weeks} wk`;
    return null;
}
