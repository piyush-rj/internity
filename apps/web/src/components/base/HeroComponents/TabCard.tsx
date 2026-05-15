import type { ReactNode, SVGProps } from "react";
import { cn } from "@/src/lib/utils";
import {
    BookGlyph,
    BriefcaseGlyph,
    ShieldGlyph,
} from "@/src/components/base/HeroComponents/glyphs";
import { WindowMock } from "@/src/components/base/HeroComponents/WindowMock";

const tabs = [
    {
        label: "Internships",
        icon: BriefcaseGlyph,
        iconBg: "bg-orange-500/15",
        iconColor: "text-orange-600",
    },
    {
        label: "Trainings",
        icon: BookGlyph,
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-700",
    },
    {
        label: "Placement Guarantee",
        icon: ShieldGlyph,
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-700",
    },
];

export function TabCard() {
    return (
        <div className="relative mx-auto max-w-6xl px-6 -mt-5">
            <div className="relative z-10 flex justify-center -mb-6">
                <div
                    className={cn(
                        "flex items-center gap-2 sm:gap-3 p-1.5",
                        "rounded-2xl border border-border bg-card",
                        "shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]",
                    )}
                >
                    {tabs.map((t, i) => (
                        <TabPill key={t.label} {...t} active={i === 0} />
                    ))}
                </div>
            </div>

            <div className="relative rounded-t-[28px] border border-b-0 border-border pt-14 pb-0 bg-neutral-200/50">
                <div className="px-4 sm:px-8">
                    <WindowMock />
                </div>
            </div>
        </div>
    );
}

function TabPill({
    label,
    icon: Icon,
    iconBg,
    iconColor,
    active,
}: {
    label: string;
    icon: (p: SVGProps<SVGSVGElement>) => ReactNode;
    iconBg: string;
    iconColor: string;
    active?: boolean;
}) {
    return (
        <button
            className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 sm:px-3 h-9 sm:h-10 text-[13px] sm:text-[14px] font-medium transition-colors",
                active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
        >
            <span
                className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    iconBg,
                )}
            >
                <Icon className={cn("h-4 w-4", iconColor)} />
            </span>
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
}
