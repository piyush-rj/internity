"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

// card shell wrapping each profile-page section with header and body
export function SectionCard({
    id,
    title,
    description,
    action,
    children,
    className,
    tooltip,
    optional,
}: {
    id: string;
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    tooltip?: string;
    optional?: boolean;
}) {
    const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(
        null,
    );

    function showTip(e: React.MouseEvent<HTMLButtonElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTipPos({ top: rect.bottom + 8, left: rect.left });
    }

    return (
        <section
            id={id}
            className={cn(
                "rounded-lg border border-border bg-card overflow-hidden scroll-mt-20",
                className,
            )}
        >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-start gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[15px] font-semibold tracking-tight text-[#008080]">
                                {title}
                            </h2>
                            {optional && (
                                <span className="text-[11.5px] text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            )}
                            {tooltip && (
                                <button
                                    type="button"
                                    onMouseEnter={showTip}
                                    onMouseLeave={() => setTipPos(null)}
                                    tabIndex={-1}
                                    aria-label={`About ${title}`}
                                    className="h-4 w-4 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors shrink-0"
                                >
                                    <Info className="h-2.5 w-2.5" />
                                </button>
                            )}
                        </div>
                        {description && (
                            <p className="mt-0.5 text-[12px] text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action}
            </header>
            <div className="p-5">{children}</div>

            {/* Fixed-position tooltip — escapes overflow:hidden on the card */}
            {tipPos && tooltip && (
                <div
                    role="tooltip"
                    style={{ top: tipPos.top, left: tipPos.left }}
                    className="fixed z-9999 pointer-events-none w-64 rounded-lg border border-border bg-background shadow-xl px-3 py-2.5"
                >
                    <p className="text-[11.5px] font-semibold text-foreground mb-0.5">
                        {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {tooltip}
                    </p>
                </div>
            )}
        </section>
    );
}
