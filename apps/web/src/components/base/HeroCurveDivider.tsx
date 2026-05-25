import {
    BookOpenIcon,
    BriefcaseIcon,
    BuildingIcon,
} from "@/src/components/base/icons";
import { cn } from "@/src/lib/utils";

type Tab = {
    icon: React.ReactNode;
    label: string;
    iconBg: string;
    iconFg: string;
};

const tabs: Tab[] = [
    {
        icon: <BriefcaseIcon className="h-3.5 w-3.5" />,
        label: "Internships",
        iconBg: "bg-orange-100",
        iconFg: "text-orange-600",
    },
    {
        icon: <BuildingIcon className="h-3.5 w-3.5" />,
        label: "Jobs",
        iconBg: "bg-emerald-100",
        iconFg: "text-emerald-700",
    },
    {
        icon: <BookOpenIcon className="h-3.5 w-3.5" />,
        label: "Trainings",
        iconBg: "bg-violet-100",
        iconFg: "text-violet-700",
    },
];

export function HeroCurveDivider() {
    return (
        <div className="relative h-24 w-full">
            <svg
                viewBox="0 0 1440 96"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full text-border"
                aria-hidden
            >
                <path
                    d="M 0 95 L 560 95 Q 600 95 600 55 Q 600 16 640 16 L 800 16 Q 840 16 840 55 Q 840 95 880 95 L 1440 95"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className="absolute inset-x-0 top-0 flex justify-center">
                <div
                    className={cn(
                        "flex items-center gap-1 p-1.5",
                        "rounded-lg border border-border bg-card",
                        "shadow-[0_10px_32px_-12px_rgba(15,23,42,0.18)]",
                    )}
                >
                    {tabs.map((t, i) => (
                        <button
                            key={t.label}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                i === 0
                                    ? "bg-secondary text-foreground"
                                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-md",
                                    t.iconBg,
                                    t.iconFg,
                                )}
                            >
                                {t.icon}
                            </span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
