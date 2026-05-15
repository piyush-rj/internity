"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function PaginationBar({
    basePath,
    page,
    pageSize,
    total,
}: {
    basePath: string;
    page: number;
    pageSize: number;
    total: number;
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (total <= pageSize) return null;

    function go(next: number) {
        const params = new URLSearchParams(sp?.toString() ?? "");
        if (next <= 1) params.delete("page");
        else params.set("page", String(next));
        const qs = params.toString();
        router.replace(qs ? `${basePath}?${qs}` : basePath);
    }

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <nav
            aria-label="Pagination"
            className="flex items-center justify-between gap-3 px-1 py-2"
        >
            <span className="text-[11.5px] text-muted-foreground tabular-nums">
                {start}–{end} of {total}
            </span>
            <div className="flex items-center gap-1.5">
                <PageBtn
                    label="Previous"
                    disabled={page <= 1}
                    onClick={() => go(page - 1)}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </PageBtn>
                <span className="text-[12px] font-medium tabular-nums px-2">
                    Page {page} of {totalPages}
                </span>
                <PageBtn
                    label="Next"
                    disabled={page >= totalPages}
                    onClick={() => go(page + 1)}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </PageBtn>
            </div>
        </nav>
    );
}

function PageBtn({
    children,
    label,
    disabled,
    onClick,
}: {
    children: React.ReactNode;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md",
                "border border-border bg-background text-foreground",
                "hover:bg-secondary/40 transition-colors",
                "disabled:opacity-40 disabled:pointer-events-none",
            )}
        >
            {children}
        </button>
    );
}
