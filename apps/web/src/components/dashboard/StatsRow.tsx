import type { ComponentType, SVGProps } from "react";
import { cn } from "@/src/lib/utils";
import {
    BookmarkIcon,
    BriefcaseIcon,
    FileTextIcon,
    UserIcon,
} from "@/src/components/dashboard/icons";

type Stat = {
    label: string;
    value: string;
    delta: string;
    positive?: boolean;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const stats: Stat[] = [
    {
        label: "Applications",
        value: "12",
        delta: "+3 this week",
        positive: true,
        icon: FileTextIcon,
    },
    {
        label: "Profile views",
        value: "184",
        delta: "+22% vs last week",
        positive: true,
        icon: UserIcon,
    },
    { label: "Saved", value: "8", delta: "2 expire soon", icon: BookmarkIcon },
    {
        label: "Interviews",
        value: "3",
        delta: "1 scheduled",
        positive: true,
        icon: BriefcaseIcon,
    },
];

export function StatsRow() {
    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => {
                const Icon = s.icon;
                return (
                    <div
                        key={s.label}
                        className="rounded-xl border border-border bg-card p-4"
                    >
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                            <span className="text-[12px]">{s.label}</span>
                        </div>
                        <div className="mt-2 text-[26px] font-semibold tracking-tight">
                            {s.value}
                        </div>
                        <div
                            className={cn(
                                "mt-1 text-[11px]",
                                s.positive
                                    ? "text-success"
                                    : "text-muted-foreground",
                            )}
                        >
                            {s.delta}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
