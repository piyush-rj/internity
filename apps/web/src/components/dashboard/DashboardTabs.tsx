"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Applications } from "@/src/components/dashboard/Applications";
import { RecommendedInternships } from "@/src/components/dashboard/RecommendedInternships";
import { cn } from "@/src/lib/utils";
import { ChevronRight } from "../base/HeroComponents/glyphs";

type Tab = "recommended" | "applications";

const TABS: Array<{ key: Tab; label: string }> = [
    {
        key: "recommended",
        label: "Recommended",
    },
    {
        key: "applications",
        label: "Applications",
    },
];

export function DashboardTabs() {
    const [tab, setTab] = useState<Tab>("recommended");
    const activeIndex = TABS.findIndex((t) => t.key === tab);

    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState<{
        left: number;
        width: number;
    } | null>(null);

    useLayoutEffect(() => {
        const el = tabRefs.current[activeIndex];
        if (!el) return;
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }, [activeIndex]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <nav
                    role="tablist"
                    aria-label="Dashboard sections"
                    className="relative inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shadow-xs"
                >
                    {indicator && (
                        <span
                            aria-hidden
                            className="absolute top-1 bottom-1 rounded-md bg-card shadow-xs ring-1 ring-border transition-[left,width] duration-300 ease-out"
                            style={{
                                left: indicator.left,
                                width: indicator.width,
                            }}
                        />
                    )}

                    {TABS.map((t, i) => {
                        const active = t.key === tab;
                        return (
                            <button
                                key={t.key}
                                ref={(el) => {
                                    tabRefs.current[i] = el;
                                }}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(t.key)}
                                className={cn(
                                    "relative z-10 inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-medium cursor-pointer",
                                    "transition-colors duration-200 ease-out",
                                    active
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </nav>

                <Link
                    href={
                        tab === "recommended"
                            ? "/home/internships"
                            : "/home/applications"
                    }
                    className="text-neutral-600 text-xs flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    {tab === "recommended"
                        ? "see all recommended jobs"
                        : "see all your applications"}
                    <ChevronRight className="size-2.5" />
                </Link>
            </div>

            <div>
                {tab === "recommended" ? (
                    <RecommendedInternships />
                ) : (
                    <Applications />
                )}
            </div>
        </div>
    );
}
