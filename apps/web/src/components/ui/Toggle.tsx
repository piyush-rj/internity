"use client";

import { cn } from "@/src/lib/utils";

// Pill-shaped on/off toggle. The label sits to the left of the switch
// (matches the Internshala spec image: "Does this internship come with a
// pre-placement offer (PPO)? [toggle]").

export function Toggle({
    checked,
    onChange,
    label,
    ariaLabel,
    disabled = false,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label?: React.ReactNode;
    ariaLabel?: string;
    disabled?: boolean;
}) {
    return (
        <label
            className={cn(
                "inline-flex items-center gap-3 text-[13px] select-none",
                disabled ? "opacity-60" : "cursor-pointer",
            )}
        >
            {label && <span>{label}</span>}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    "outline-none focus-visible:ring-3 focus-visible:ring-foreground/15",
                    checked ? "bg-foreground" : "bg-border",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                )}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 rounded-full bg-background shadow transition-transform",
                        checked ? "translate-x-4.5" : "translate-x-0.5",
                    )}
                />
            </button>
        </label>
    );
}
