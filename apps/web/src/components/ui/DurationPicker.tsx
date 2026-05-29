"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Internship duration picker. Matches the Internshala-style two-control
// design: a numeric value (combobox dropdown + free typing) paired with a
// unit selector (months / weeks). The dropdown lists 1–12 for months,
// 1–10 for weeks, plus a "Custom (write your own)" sentinel at the end
// that clears + focuses the input so the founder knows they can type any
// number themselves.
//
// Storage: only ever writes to the active unit's column — the other is
// nulled. Renderers should use formatDuration() to pick whichever is set.

const MONTH_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const WEEK_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CUSTOM_SENTINEL = "__custom__";

type Unit = "months" | "weeks";

export function DurationPicker({
    months,
    weeks,
    onMonthsChange,
    onWeeksChange,
}: {
    months: number | null;
    weeks: number | null;
    onMonthsChange: (v: number | null) => void;
    onWeeksChange: (v: number | null) => void;
}) {
    // Pick the active unit from whichever column has a value. Defaults to
    // months when both are empty.
    const initialUnit: Unit = weeks && weeks > 0 ? "weeks" : "months";
    const [unit, setUnit] = useState<Unit>(initialUnit);
    const [raw, setRaw] = useState<string>(() => {
        if (unit === "months") return months !== null ? String(months) : "";
        return weeks !== null ? String(weeks) : "";
    });
    const [open, setOpen] = useState(false);
    const [unitOpen, setUnitOpen] = useState(false);
    const valueRef = useRef<HTMLInputElement | null>(null);
    const unitRef = useRef<HTMLDivElement | null>(null);

    const steps = unit === "months" ? MONTH_STEPS : WEEK_STEPS;

    useEffect(() => {
        if (!unitOpen) return;
        function onDoc(e: MouseEvent) {
            if (
                unitRef.current &&
                !unitRef.current.contains(e.target as Node)
            ) {
                setUnitOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [unitOpen]);

    function commit(nextRaw: string, nextUnit: Unit) {
        const trimmed = nextRaw.trim();
        if (!trimmed) {
            // Empty → clear both columns. Picker shows nothing selected.
            onMonthsChange(null);
            onWeeksChange(null);
            return;
        }
        const n = Number(trimmed);
        if (!Number.isFinite(n) || n <= 0) {
            // Invalid intermediate input (e.g. user typed "-"). Don't commit
            // a value yet; wait for them to type something valid.
            return;
        }
        const rounded = Math.round(n);
        if (nextUnit === "months") {
            onMonthsChange(rounded);
            onWeeksChange(null);
        } else {
            onWeeksChange(rounded);
            onMonthsChange(null);
        }
    }

    function changeUnit(next: Unit) {
        if (next === unit) {
            setUnitOpen(false);
            return;
        }
        setUnit(next);
        // Carry the typed number across units rather than wiping it — the
        // founder likely meant the same number, just in a different unit.
        commit(raw, next);
        setUnitOpen(false);
    }

    const currentNum = useMemo(() => {
        if (raw.trim() === "") return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [raw]);

    return (
        <div className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
                <div className="flex items-center rounded-md border border-border bg-background focus-within:border-foreground/40 focus-within:ring-3 focus-within:ring-foreground/5">
                    <input
                        ref={valueRef}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={raw}
                        onChange={(e) => {
                            setRaw(e.target.value);
                            commit(e.target.value, unit);
                        }}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 120)}
                        placeholder="Choose duration"
                        className="flex-1 bg-transparent outline-none text-[13px] px-3 py-2 placeholder:text-muted-foreground/70 tabular-nums"
                    />
                    <button
                        type="button"
                        aria-label="Show duration options"
                        // Don't let the chevron steal focus from the input;
                        // otherwise the input fires onBlur, which schedules
                        // a 120ms close that races (and beats) the toggle.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setOpen((o) => !o)}
                        className="px-2 py-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </div>
                {open && (
                    <div
                        role="listbox"
                        className="absolute z-20 mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg p-1"
                    >
                        {steps.map((s) => (
                            <button
                                key={s}
                                type="button"
                                role="option"
                                aria-selected={currentNum === s}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setRaw(String(s));
                                    commit(String(s), unit);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] cursor-pointer hover:bg-accent",
                                    currentNum === s && "bg-secondary",
                                )}
                            >
                                {s}
                            </button>
                        ))}
                        <CustomOption
                            onPick={() => {
                                setRaw("");
                                onMonthsChange(null);
                                onWeeksChange(null);
                                setOpen(false);
                                // Defer focus so the listbox can unmount and
                                // the input is re-interactive.
                                requestAnimationFrame(() => {
                                    valueRef.current?.focus();
                                    valueRef.current?.select();
                                });
                            }}
                            sentinel={CUSTOM_SENTINEL}
                        />
                    </div>
                )}
            </div>
            <div className="relative" ref={unitRef}>
                <button
                    type="button"
                    onClick={() => setUnitOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={unitOpen}
                    className="inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background pl-3 pr-3 py-2 text-[13px] cursor-pointer min-w-25"
                >
                    <span>{unit}</span>
                    <ChevronDown
                        aria-hidden
                        className="h-3.5 w-3.5 text-muted-foreground"
                    />
                </button>
                {unitOpen && (
                    <div
                        role="listbox"
                        className="absolute z-20 mt-1 left-0 right-0 rounded-md border border-border bg-popover shadow-lg p-1"
                    >
                        {(["months", "weeks"] as const).map((u) => (
                            <button
                                key={u}
                                type="button"
                                role="option"
                                aria-selected={unit === u}
                                onClick={() => changeUnit(u)}
                                className={cn(
                                    "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] cursor-pointer hover:bg-accent",
                                    unit === u && "bg-secondary",
                                )}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CustomOption({
    onPick,
    sentinel,
}: {
    onPick: () => void;
    sentinel: string;
}) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={false}
            value={sentinel}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onPick}
            className={cn(
                "block w-full text-left px-2 py-1.5 text-[12.5px] font-medium cursor-pointer",
                "border-t border-border mt-1 pt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50",
            )}
        >
            Custom (write your own)
        </button>
    );
}
