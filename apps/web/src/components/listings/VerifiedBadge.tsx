import { PiSealCheckFill } from "react-icons/pi";
import { cn } from "@/src/lib/utils";

// small verified chip rendered next to a company name
export function VerifiedBadge({
    size = "inline",
    label = false,
}: {
    size?: "inline" | "chip";
    label?: boolean;
}) {
    const wrap =
        size === "chip"
            ? "inline-flex items-center gap-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 text-[11px] font-medium"
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
