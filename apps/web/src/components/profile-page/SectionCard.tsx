import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

/**
 * Card shell every section on the profile page lives in. Provides a header
 * row (title + optional action) and a body slot below a divider.
 *
 * Accepts an `id` so the sidebar's onStepClick can scrollIntoView() to it.
 */
export function SectionCard({
    id,
    title,
    description,
    action,
    children,
    className,
}: {
    id: string;
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            id={id}
            className={cn(
                "rounded-xl border border-border bg-neutral-50 overflow-hidden scroll-mt-20",
                className,
            )}
        >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
                <div>
                    <h2 className="text-[15px] font-semibold tracking-tight">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action}
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}
