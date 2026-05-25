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
                "rounded-lg border border-border bg-neutral-50 overflow-hidden scroll-mt-20",
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
