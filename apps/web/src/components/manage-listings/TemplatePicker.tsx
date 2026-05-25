"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
    LISTING_TEMPLATES,
    TEMPLATE_CATEGORIES,
    type ListingTemplate,
} from "@/src/components/manage-listings/listingTemplates";
import { cn } from "@/src/lib/utils";

/**
 * Compact "Start from a template" picker shown at the top of the
 * new-listing form. First-time posters get a head start; experienced ones
 * can ignore it. Picking a template fires `onPick` with the template
 * payload — the parent decides how to merge into form state.
 */
export function TemplatePicker({
    onPick,
}: {
    onPick: (template: ListingTemplate) => void;
}) {
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(
        TEMPLATE_CATEGORIES[0] ?? "",
    );

    const visible = LISTING_TEMPLATES.filter(
        (t) => t.category === activeCategory,
    );

    return (
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                    <div className="space-y-0.5">
                        <div className="text-[13px] font-medium">
                            Start from a template
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">
                            Skip the blank page — pick a role to pre-fill
                            title, description, skills, and perks.
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="text-[12px] font-medium text-brand hover:underline cursor-pointer"
                >
                    {open ? "Hide templates" : "Browse"}
                </button>
            </div>

            {open && (
                <div className="mt-3 space-y-2.5">
                    <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
                        {TEMPLATE_CATEGORIES.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setActiveCategory(c)}
                                className={cn(
                                    "shrink-0 px-2.5 h-7 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer",
                                    c === activeCategory
                                        ? "bg-foreground text-background"
                                        : "bg-background text-muted-foreground hover:text-foreground border border-border",
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {visible.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => {
                                    onPick(t);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "text-left px-2.5 py-2 rounded-md border border-border bg-background",
                                    "hover:border-foreground/30 hover:bg-secondary/40 transition-colors cursor-pointer",
                                )}
                            >
                                <div className="text-[12px] font-medium truncate">
                                    {t.label}
                                </div>
                                <div className="mt-0.5 text-[10.5px] text-muted-foreground truncate">
                                    {t.skillTags.slice(0, 3).join(" · ")}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
