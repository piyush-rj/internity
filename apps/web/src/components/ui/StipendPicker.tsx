"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

// Stipend min/max picker with a fixed-step dropdown and free-text input.
// min: 1000..10000 step 1000. max: depends on the picked min value; goes
// up to 20000 step 1000. Free-typed values are always accepted.

const MIN_STEPS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const MAX_DEFAULT_CAP = 20000;
const MAX_WINDOW_ABOVE_MIN = 10000;

function isStandardStep(n: number, steps: readonly number[]): boolean {
    return steps.includes(n);
}

// Max dropdown options always start at the picked min. Cap is the higher of
// the fixed 20k ceiling (for low mins) or min + 10k (for custom highs > 10k).
// Always step 1000.
function maxStepsFor(min: number): number[] {
    const start = Math.max(min || 1000, 1000);
    const cap = Math.max(MAX_DEFAULT_CAP, start + MAX_WINDOW_ABOVE_MIN);
    const out: number[] = [];
    for (let v = start; v <= cap; v += 1000) out.push(v);
    return out;
}

export function StipendPicker({
    min,
    max,
    onMin,
    onMax,
    placeholderMin = "Min",
    placeholderMax = "Max",
}: {
    min: number | null;
    max: number | null;
    onMin: (v: number | null) => void;
    onMax: (v: number | null) => void;
    placeholderMin?: string;
    placeholderMax?: string;
}) {
    const maxSteps = useMemo(() => maxStepsFor(min ?? 1000), [min]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ComboNumber
                value={min}
                onChange={(n) => {
                    onMin(n);
                    if (n !== null && max !== null && max < n) onMax(n);
                }}
                steps={MIN_STEPS}
                placeholder={placeholderMin}
                ariaLabel="Stipend min"
            />
            <ComboNumber
                value={max}
                onChange={onMax}
                steps={maxSteps}
                placeholder={placeholderMax}
                ariaLabel="Stipend max"
            />
        </div>
    );
}

function ComboNumber({
    value,
    onChange,
    steps,
    placeholder,
    ariaLabel,
}: {
    value: number | null;
    onChange: (v: number | null) => void;
    steps: readonly number[];
    placeholder: string;
    ariaLabel: string;
}) {
    const [text, setText] = useState<string>(
        value !== null ? String(value) : "",
    );
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    function commit(raw: string) {
        const t = raw.trim();
        if (!t) {
            onChange(null);
            return;
        }
        const n = Number(t);
        if (Number.isFinite(n) && n >= 0) {
            onChange(Math.floor(n));
        }
    }

    function pickCustom() {
        // Clear the field + drop focus into it so the user knows the input
        // is now editable and they can type whatever amount they want.
        setText("");
        onChange(null);
        setOpen(false);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
    }

    return (
        <div className="relative">
            <div className="flex items-center rounded-md border border-border bg-background focus-within:border-foreground/40 focus-within:ring-3 focus-within:ring-foreground/5">
                <span className="pl-3 pr-2 text-muted-foreground text-[13px]">
                    ₹
                </span>
                <input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    aria-label={ariaLabel}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (e.target.value === "") onChange(null);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        setTimeout(() => setOpen(false), 120);
                        commit(text);
                    }}
                    placeholder={placeholder}
                    className="no-spinner flex-1 bg-transparent outline-none text-[13px] py-2 pr-1"
                />
                <button
                    type="button"
                    aria-label="Show stipend options"
                    // Prevent the chevron from stealing focus from the input
                    // — otherwise the input's deferred onBlur close beats
                    // this toggle and the dropdown blinks shut.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpen((o) => !o)}
                    className="px-2 py-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    ▾
                </button>
            </div>
            {open && (
                <div className="absolute z-20 mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg p-1">
                    {steps.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange(s);
                                setText(String(s));
                                setOpen(false);
                            }}
                            className={cn(
                                "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] cursor-pointer hover:bg-accent",
                                value === s && "bg-secondary",
                            )}
                        >
                            ₹{s.toLocaleString("en-IN")}
                            {!isStandardStep(s, steps) && " (custom)"}
                        </button>
                    ))}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={pickCustom}
                        className={cn(
                            "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] font-medium cursor-pointer",
                            "border-t border-border mt-1 pt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50",
                        )}
                    >
                        Custom (write your own)
                    </button>
                </div>
            )}
        </div>
    );
}
