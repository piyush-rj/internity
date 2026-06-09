"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { JobTitle } from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { cn } from "@/src/lib/utils";

// Predefined roles only — "Other / Custom" is handled separately as free-text
// custom roles, so it is NOT a toggleable JobTitle here.
const OPTIONS: ReadonlyArray<{ value: JobTitle; label: string }> = JOB_TITLES;

// Sentinel value for the dropdown's custom entry.
const CUSTOM_OPTION = "__custom__";

const LABEL: Record<string, string> = Object.fromEntries(
    OPTIONS.map((o) => [o.value, o.label]),
);

// Compact label for badges: drop the trailing " Internship" so several fit
// side by side in the narrow filter panel.
const SHORT_LABEL: Record<string, string> = Object.fromEntries(
    OPTIONS.map((o) => [o.value, o.label.replace(/\s+Internship$/, "")]),
);

const MAX_CUSTOM_ROLE_LEN = 60;

// Multi-select job titles via the original dropdown, plus free-text custom
// roles. Picking a predefined title adds it; picking "Other / Custom" reveals
// an input + arrow to append one or more custom roles. Every selection — both
// predefined and custom — shows as a removable badge.
export function JobTitleMultiSelect({
    selected,
    onToggle,
    inputClassName,
    customRoles,
    onAddCustomRole,
    onRemoveCustomRole,
}: {
    selected: readonly JobTitle[];
    onToggle: (value: JobTitle) => void;
    inputClassName: string;
    customRoles: readonly string[];
    onAddCustomRole: (text: string) => void;
    onRemoveCustomRole: (text: string) => void;
}) {
    const [draft, setDraft] = useState("");
    // Whether the custom input is revealed. Opens via "Other / Custom" (and on
    // mount if custom roles already exist) and is dismissed via the input's ×.
    const [customOpen, setCustomOpen] = useState(customRoles.length > 0);
    const showCustomInput = customOpen;

    function closeCustomInput() {
        setCustomOpen(false);
        setDraft("");
    }

    const available = OPTIONS.filter((o) => !selected.includes(o.value));

    function appendDraft() {
        const text = draft.trim().slice(0, MAX_CUSTOM_ROLE_LEN);
        if (!text) return;
        onAddCustomRole(text);
        setDraft("");
    }

    return (
        <div className="space-y-2">
            <select
                value=""
                onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    if (v === CUSTOM_OPTION) {
                        setCustomOpen(true);
                        return;
                    }
                    onToggle(v as JobTitle);
                }}
                className={cn(
                    inputClassName,
                    "appearance-none pr-8 cursor-pointer",
                )}
            >
                <option value="">
                    {selected.length > 0 || customRoles.length > 0
                        ? "Add another title"
                        : "Any title"}
                </option>
                {available.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
                <option value={CUSTOM_OPTION}>Other / Custom</option>
            </select>

            {(selected.length > 0 || customRoles.length > 0) && (
                <div className="flex flex-wrap gap-1">
                    {selected.map((v) => (
                        <Badge
                            key={`jt-${v}`}
                            label={SHORT_LABEL[v] ?? v}
                            removeLabel={LABEL[v] ?? v}
                            onRemove={() => onToggle(v)}
                        />
                    ))}
                    {customRoles.map((r) => (
                        <Badge
                            key={`custom-${r}`}
                            label={r}
                            removeLabel={r}
                            onRemove={() => onRemoveCustomRole(r)}
                        />
                    ))}
                </div>
            )}

            {showCustomInput && (
                <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={draft}
                            maxLength={MAX_CUSTOM_ROLE_LEN}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    appendDraft();
                                }
                            }}
                            placeholder="Type a custom role…"
                            className={cn(inputClassName, "w-full pr-8")}
                        />
                        <button
                            type="button"
                            onClick={closeCustomInput}
                            aria-label="Hide custom role input"
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={appendDraft}
                        disabled={!draft.trim()}
                        aria-label="Add custom role"
                        className={cn(
                            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            "bg-brand text-white transition-colors cursor-pointer",
                            "hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed",
                        )}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

function Badge({
    label,
    removeLabel,
    onRemove,
}: {
    label: string;
    removeLabel: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-orange-300 bg-orange-50 text-orange-700 pl-2 pr-1 py-0.5 text-[10.5px] font-medium max-w-full">
            <span className="truncate">{label}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${removeLabel}`}
                className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-orange-100 cursor-pointer shrink-0"
            >
                <X className="h-2.5 w-2.5" />
            </button>
        </span>
    );
}
