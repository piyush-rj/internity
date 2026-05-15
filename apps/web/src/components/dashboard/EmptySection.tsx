import type { ReactNode } from "react";

/**
 * Shared scaffold for dashboard tabs that don't have real content yet.
 * Keeps every placeholder visually identical so we can swap in real
 * features one at a time without rewriting the page shell.
 */
export function EmptySection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
            <header>
                <h1 className="text-[26px] font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="mt-1 text-[13.5px] text-muted-foreground max-w-xl">
                    {description}
                </p>
            </header>
            {children}
        </div>
    );
}
