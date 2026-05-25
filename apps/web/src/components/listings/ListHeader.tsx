import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function ListHeader({
    title,
    count,
    countLabel = "results",
    action,
    loading = false,
    className,
}: {
    title: string;
    count?: number;
    countLabel?: string;
    action?: ReactNode;
    loading?: boolean;
    className?: string;
}) {
    return (
        <header
            className={cn(
                "flex items-center justify-between gap-3 border-b border-dashed pb-5.5",
                className,
            )}
        >
            <div className="text-[13px] font-medium px-3.5 py-1 bg-card border border-border shadow-xs rounded-md">
                {title}
            </div>
            <div className="flex items-center gap-3">
                {!loading && count !== undefined && (
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {count} {pluralize(count, countLabel)}
                    </span>
                )}
                {action}
            </div>
        </header>
    );
}

function pluralize(count: number, label: string): string {
    if (label === "results") return count === 1 ? "result" : "results";
    return label;
}
