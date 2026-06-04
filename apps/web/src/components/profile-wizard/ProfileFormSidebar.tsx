"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import {
    computeCompletion,
    stepsConfig,
    type StepKey,
} from "@/src/components/profile-wizard/utils";
import type { StudentProfile } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

type TooltipState = {
    key: StepKey;
    top: number;
    left: number;
};

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
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    function showTooltip(key: StepKey, e: React.MouseEvent<HTMLButtonElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            key,
            top: rect.top + rect.height / 2,
            left: rect.right + 10,
        });
    }

    function hideTooltip() {
        setTooltip(null);
    }

    const activeStep = tooltip ? stepsConfig.find((s) => s.key === tooltip.key) : null;

    return (
        <>
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
                            <div key={key} className="relative group/row">
                                <button
                                    type="button"
                                    onClick={() => onStepClick(key)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-2.5 h-8 rounded-sm text-[13px] text-left font-medium",
                                        "transition-colors pr-8",
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

                                {/* Info button — fades in on row hover */}
                                <button
                                    type="button"
                                    onMouseEnter={(e) => showTooltip(key, e)}
                                    onMouseLeave={hideTooltip}
                                    tabIndex={-1}
                                    aria-label={`About ${label}`}
                                    className={cn(
                                        "absolute right-1.5 top-1/2 -translate-y-1/2",
                                        "h-5 w-5 inline-flex items-center justify-center rounded-full",
                                        "border border-border text-muted-foreground",
                                        "opacity-0 group-hover/row:opacity-100 transition-opacity",
                                        "hover:border-foreground/40 hover:text-foreground",
                                    )}
                                >
                                    <Info className="h-2.5 w-2.5" />
                                </button>
                            </div>
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

            {/* Tooltip rendered as fixed — escapes every overflow/stacking context */}
            {tooltip && activeStep && (
                <div
                    role="tooltip"
                    style={{ top: tooltip.top, left: tooltip.left }}
                    className={cn(
                        "fixed z-9999 -translate-y-1/2 pointer-events-none",
                        "w-56 rounded-lg border border-border bg-background shadow-xl px-3 py-2.5",
                    )}
                >
                    <p className="text-[11.5px] font-semibold text-foreground mb-0.5">
                        {activeStep.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {activeStep.description}
                    </p>
                    {done[tooltip.key] ? (
                        <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-emerald-600 font-medium">
                            <Check className="h-2.5 w-2.5" />
                            Completed
                        </p>
                    ) : tooltip.key !== "summary" ? (
                        <p className="mt-1.5 text-[10.5px] text-amber-600 font-medium">
                            Not filled yet
                        </p>
                    ) : null}
                </div>
            )}
        </>
    );
}
