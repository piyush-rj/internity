"use client";

import { Check } from "lucide-react";
import {
    computeCompletion,
    stepsConfig,
    type StepKey,
} from "@/src/components/profile-wizard/utils";
import type { StudentProfile } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export function ProfileFormSidebar({
    currentStep,
    onStepClick,
    profile,
}: {
    currentStep: StepKey;
    onStepClick: (step: StepKey) => void;
    profile: StudentProfile | null;
}) {
    const { done, pct } = computeCompletion(profile);

    return (
        <aside
            className={cn(
                "shrink-0 w-60 hidden md:flex flex-col",
                "sticky top-13 h-[calc(100vh-3.25rem)]",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 pt-4">
                <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Your profile
                </div>
                {stepsConfig.map(({ key, label, icon, iconFilled }) => {
                    const active = currentStep === key;
                    const isDone = done[key];
                    const Icon = active ? iconFilled : icon;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onStepClick(key)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 h-8 rounded-sm text-[13px] text-left font-medium",
                                "transition-colors",
                                active
                                    ? "bg-white ring-1 ring-black/9 text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4 shrink-0",
                                    active && "text-orange-500",
                                )}
                            />
                            <span className="flex-1 truncate">{label}</span>
                            {isDone && (
                                <span
                                    className={cn(
                                        "inline-flex items-center justify-center h-4 w-4 rounded-full",
                                        "bg-emerald-500/15 text-emerald-600",
                                    )}
                                >
                                    <Check className="h-2.5 w-2.5" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="border-t border-border p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11.5px] text-muted-foreground">
                        Profile completion
                    </span>
                    <span className="text-[12px] font-semibold tabular-nums">
                        {pct}%
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </aside>
    );
}
