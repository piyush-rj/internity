"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { PERK_SUGGESTIONS } from "@/src/lib/catalog/perks";
import { cn } from "@/src/lib/utils";

// Perks selector: toggleable suggestion pills + an explicit "+ Custom"
// affordance that opens an inline input to add a free-text perk. Selected
// perks (suggestion or custom) render as filled chips at the top with an
// X to remove. Mirrors the Internshala spec image — chips at top, picker
// below.
export function PerksPicker({
    value,
    onChange,
}: {
    value: string[];
    onChange: (next: string[]) => void;
}) {
    const [customOpen, setCustomOpen] = useState(false);
    const [customText, setCustomText] = useState("");

    const lowered = useMemo(
        () => new Set(value.map((v) => v.toLowerCase())),
        [value],
    );

    function toggle(perk: string) {
        if (lowered.has(perk.toLowerCase())) {
            onChange(
                value.filter((v) => v.toLowerCase() !== perk.toLowerCase()),
            );
        } else {
            onChange([...value, perk]);
        }
    }

    function addCustom() {
        const t = customText.trim();
        if (!t) return;
        if (lowered.has(t.toLowerCase())) {
            setCustomText("");
            return;
        }
        onChange([...value, t]);
        setCustomText("");
    }

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((v) => (
                        <span
                            key={v}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary text-foreground text-[12px] px-2.5 py-1"
                        >
                            {v}
                            <button
                                type="button"
                                onClick={() => toggle(v)}
                                aria-label={`Remove ${v}`}
                                className="opacity-70 hover:opacity-100 cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-1.5">
                {PERK_SUGGESTIONS.map((s) => {
                    const active = lowered.has(s.toLowerCase());
                    return (
                        <button
                            key={s}
                            type="button"
                            onClick={() => toggle(s)}
                            className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] cursor-pointer transition-colors",
                                active
                                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                                    : "border-border bg-background hover:bg-secondary/40 text-muted-foreground",
                            )}
                        >
                            {active ? (
                                <Check className="h-3 w-3" />
                            ) : (
                                <Plus className="h-3 w-3" />
                            )}
                            {s}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setCustomOpen((v) => !v)}
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] cursor-pointer transition-colors",
                        customOpen
                            ? "border-foreground/30 bg-foreground/5 text-foreground"
                            : "border-dashed border-border bg-background hover:bg-secondary/40 text-muted-foreground",
                    )}
                >
                    <Plus className="h-3 w-3" />
                    Custom
                </button>
            </div>

            {customOpen && (
                <div className="flex gap-2 pt-1">
                    <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addCustom();
                            }
                        }}
                        placeholder="e.g. Gym membership"
                        maxLength={60}
                        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5"
                    />
                    <button
                        type="button"
                        onClick={addCustom}
                        disabled={!customText.trim()}
                        className="rounded-md bg-foreground text-background px-3 py-1.5 text-[12.5px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );
}
