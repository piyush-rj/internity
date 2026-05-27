"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

// A controlled tag-input chip widget with suggestion dropdown. Free-typed
// values become tags on Enter / comma / blur. Suggestions are filtered
// fuzzily by what the user is typing and grouped on top.
export function TagsInput({
    value,
    onChange,
    suggestions = [],
    placeholder,
    max,
    inputClassName,
}: {
    value: string[];
    onChange: (next: string[]) => void;
    suggestions?: readonly string[];
    placeholder?: string;
    max?: number;
    inputClassName?: string;
}) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const lowered = useMemo(
        () => value.map((v) => v.trim().toLowerCase()),
        [value],
    );

    const filtered = useMemo(() => {
        const q = text.trim().toLowerCase();
        const not = new Set(lowered);
        return suggestions
            .filter(
                (s) =>
                    !not.has(s.toLowerCase()) &&
                    (q === "" || s.toLowerCase().includes(q)),
            )
            .slice(0, 8);
    }, [text, suggestions, lowered]);

    function add(raw: string) {
        const t = raw.trim();
        if (!t) return;
        if (max !== undefined && value.length >= max) return;
        if (lowered.includes(t.toLowerCase())) {
            setText("");
            return;
        }
        onChange([...value, t]);
        setText("");
    }

    function removeAt(i: number) {
        onChange(value.filter((_, idx) => idx !== i));
    }

    return (
        <div className="relative">
            <div
                className={cn(
                    "flex flex-wrap gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 min-h-10",
                    "focus-within:border-foreground/40 focus-within:ring-3 focus-within:ring-foreground/5",
                    inputClassName,
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((v, i) => (
                    <span
                        key={`${v}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary text-foreground text-[12px] px-2 py-0.5"
                    >
                        {v}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAt(i);
                            }}
                            aria-label={`Remove ${v}`}
                            className="opacity-70 hover:opacity-100 cursor-pointer"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        // delay so click on suggestion still fires
                        setTimeout(() => setOpen(false), 120);
                        if (text.trim()) add(text);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            add(text);
                        } else if (
                            e.key === "Backspace" &&
                            text === "" &&
                            value.length > 0
                        ) {
                            removeAt(value.length - 1);
                        }
                    }}
                    placeholder={value.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/70"
                />
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-20 mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg p-1">
                    {filtered.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                add(s);
                                inputRef.current?.focus();
                            }}
                            className="block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
            {max !== undefined && (
                <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                    {value.length}/{max}
                </div>
            )}
        </div>
    );
}
