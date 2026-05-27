"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Editable list of one-line bullets. Each item is its own input row with a
// remove button; an "+ Add" link adds a new row. Empty rows are kept while
// editing and trimmed on save (handled by the parent at submit time).

export function BulletList({
    value,
    onChange,
    placeholders,
    max = 20,
    addLabel = "+ Add",
    ariaLabel,
}: {
    value: string[];
    onChange: (next: string[]) => void;
    placeholders?: string[];
    max?: number;
    addLabel?: string;
    ariaLabel?: string;
}) {
    // Always render at least one input so the field doesn't look empty/dead.
    const rows = value.length === 0 ? [""] : value;

    function setAt(i: number, v: string) {
        const next = rows.slice();
        next[i] = v;
        onChange(next);
    }
    function add() {
        if (rows.length >= max) return;
        onChange([...rows, ""]);
    }
    function remove(i: number) {
        if (rows.length <= 1) {
            // Clear the only row instead of leaving an empty array.
            onChange([""]);
            return;
        }
        onChange(rows.filter((_, idx) => idx !== i));
    }
    function onKey(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (rows.length < max) {
                const next = rows.slice();
                next.splice(i + 1, 0, "");
                onChange(next);
                // Move focus to the new row in the next paint.
                requestAnimationFrame(() => {
                    const el = document.querySelector<HTMLInputElement>(
                        `[data-bullet-row="${i + 1}"]`,
                    );
                    el?.focus();
                });
            }
        } else if (
            e.key === "Backspace" &&
            rows[i] === "" &&
            rows.length > 1
        ) {
            e.preventDefault();
            remove(i);
            requestAnimationFrame(() => {
                const target = Math.max(0, i - 1);
                const el = document.querySelector<HTMLInputElement>(
                    `[data-bullet-row="${target}"]`,
                );
                el?.focus();
            });
        }
    }

    return (
        <div
            className="space-y-1.5"
            role="group"
            aria-label={ariaLabel}
        >
            {rows.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[12px] w-4 text-right tabular-nums shrink-0">
                        {i + 1}.
                    </span>
                    <input
                        type="text"
                        value={v}
                        data-bullet-row={i}
                        onChange={(e) => setAt(i, e.target.value)}
                        onKeyDown={(e) => onKey(e, i)}
                        placeholder={
                            placeholders?.[i] ??
                            placeholders?.[placeholders.length - 1] ??
                            ""
                        }
                        maxLength={200}
                        className={cn(
                            "flex-1 rounded-md border border-border bg-background px-3 py-2",
                            "text-[13px] placeholder:text-muted-foreground/70",
                            "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove item ${i + 1}`}
                        className={cn(
                            "h-9 w-9 inline-flex items-center justify-center rounded-md shrink-0",
                            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                            "transition-colors cursor-pointer",
                        )}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            {rows.length < max && (
                <button
                    type="button"
                    onClick={add}
                    className="inline-flex items-center gap-1 ml-6 text-[12.5px] font-medium text-brand hover:underline cursor-pointer"
                >
                    <Plus className="h-3 w-3" />
                    {addLabel}
                </button>
            )}
        </div>
    );
}
