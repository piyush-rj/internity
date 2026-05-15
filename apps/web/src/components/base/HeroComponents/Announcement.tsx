import { SiBuymeacoffee } from "react-icons/si";
import { ArrowUpRight } from "@/src/components/base/HeroComponents/glyphs";
import { cn } from "@/src/lib/utils";

export function Announcement() {
    return (
        <a
            href="#"
            className={cn(
                "group inline-flex items-center gap-1.5 group",
                "rounded-full border border-black/10 bg-card",
                "pl-4 pr-0.75 py-0.75",
                "text-[12px] font-medium",
                "hover:bg-secondary/60 transition-colors transform duration-250",
            )}
        >
            <SiBuymeacoffee
                style={{ willChange: "auto" }}
                className="-rotate-5 size-4 group-hover:-rotate-10 transition-all transform duration-200"
            />
            <span className="text-foreground">
                Celebrating 50,000 placements on Internity
            </span>
            <span
                className={cn(
                    "inline-flex items-center gap-1",
                    "rounded-full border border-border bg-background",
                    "px-2.5 py-1",
                    "text-[12px] text-muted-foreground",
                    "group-hover:text-foreground transition-colors transform duration-200",
                )}
            >
                Read more
                <ArrowUpRight className="h-3 w-3" />
            </span>
        </a>
    );
}
