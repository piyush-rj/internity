import { PiSealCheckFill } from "react-icons/pi";
import { cn } from "@/src/lib/utils";

/**
 * Small "Verified" chip rendered next to a company name. Companies on the
 * platform only become visible to students once admin approves them, so the
 * badge is implicit on every public listing — but rendering it explicitly
 * makes the trust signal load-bearing for the student.
 *
 * Defaults to the compact `inline` variant for inline use next to text;
 * `chip` is a larger standalone version for headers.
 */
export function VerifiedBadge({
    size = "inline",
    label = false,
}: {
    size?: "inline" | "chip";
    /** When true, shows the word "Verified" beside the seal. */
    label?: boolean;
}) {
    const wrap =
        size === "chip"
            ? "inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 text-[11px] font-medium"
            : "inline-flex items-center gap-0.5 text-orange-600";
    const icon = size === "chip" ? "h-3.5 w-3.5" : "h-3.5 w-3.5";
    const labelClass = size === "chip" ? "" : "text-[11px] font-medium";

    return (
        <span
            className={cn(wrap)}
            title="This company was vetted by SpiderSkill admins."
            aria-label="Verified company"
        >
            <PiSealCheckFill className={icon} />
            {(label || size === "chip") && (
                <span className={labelClass}>Verified</span>
            )}
        </span>
    );
}
