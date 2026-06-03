import { SiBuymeacoffee } from "react-icons/si";
import { ArrowUpRight } from "@/src/components/base/HeroComponents/glyphs";
import { cn } from "@/src/lib/utils";

export function Announcement() {
    return (
        <a
            href="/about"
            className={cn(
                "group inline-flex items-center gap-1.5 max-w-full",
                "rounded-full border border-black/10 bg-card",
                "pl-3 pr-1 py-0.75 sm:pl-4 sm:pr-0.75",
                "sm:text-[12px] font-medium text-[11px]",
                "whitespace-nowrap",
            )}
        >
            <SiBuymeacoffee
                style={{ willChange: "auto" }}
                className="-rotate-5 size-4 shrink-0 group-hover:-rotate-10 transition-all transform duration-200"
            />
            <span className="text-foreground truncate">
                <span className="sm:hidden">50,000 placements</span>
                <span className="hidden sm:inline">
                    Celebrating 50,000 placements on Spiderskill
                </span>
            </span>
            <span
                className={cn(
                    "inline-flex items-center gap-1 shrink-0",
                    "rounded-full border border-border bg-neutral-800",
                    "px-2 py-0.5 sm:px-2.5 sm:py-1",
                    "sm:text-[12px] text-neutral-200 group-hover:text-neutral-100 text-[10px] group",
                )}
            >
                <span className="hidden sm:inline">Read more</span>
                <ArrowUpRight className="h-3 w-3 group-hover:-translate-y-px group-hover:translate-x-px transition-all transform duration-200" />
            </span>
        </a>
    );
}
