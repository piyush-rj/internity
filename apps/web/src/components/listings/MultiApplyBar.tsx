"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { applicationApi, type ApplyBatchSkipReason } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { useMultiSelectStore } from "@/src/store/useMultiSelectStore";
import { cn } from "@/src/lib/utils";

const COVER_LIMIT = 150;

// floating bottom bar to batch-apply across selected listings
export function MultiApplyBar() {
    const { me } = useMe();
    const selected = useMultiSelectStore((s) => s.selected);
    const clear = useMultiSelectStore((s) => s.clear);
    const [dialogOpen, setDialogOpen] = useState(false);

    const count = selected.size;
    const visible = !!me && me.role === "STUDENT" && count > 0;

    if (!visible) return null;

    return (
        <>
            <div
                className={cn(
                    "fixed bottom-4 left-1/2 -translate-x-1/2 z-30",
                    "rounded-full border border-border bg-background shadow-lg",
                    "px-4 py-2 flex items-center gap-2",
                )}
            >
                <span className="text-[12.5px] font-medium tabular-nums">
                    {count} selected
                </span>
                <span className="h-4 w-px bg-border" aria-hidden />
                <button
                    type="button"
                    onClick={() => clear()}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2"
                >
                    Clear
                </button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={() => setDialogOpen(true)}
                    className="h-8 px-3 text-[12.5px] cursor-pointer"
                >
                    Apply to {count}
                </Button>
            </div>

            <MultiApplyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
}

function MultiApplyDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const selected = useMultiSelectStore((s) => s.selected);
    const clear = useMultiSelectStore((s) => s.clear);
    const [coverLetter, setCoverLetter] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, submitting]);

    if (!open) return null;

    const listings = Array.from(selected.values());
    const count = listings.length;
    const trimmed = coverLetter.trim();
    const remaining = COVER_LIMIT - coverLetter.length;
    const over = remaining < 0;

    async function submit() {
        if (over) {
            toast.error(`Keep your cover note under ${COVER_LIMIT} characters.`);
            return;
        }
        setSubmitting(true);
        try {
            const res = await applicationApi.apply_batch({
                listingIds: listings.map((l) => l.id),
                coverLetter: trimmed || undefined,
            });

            const parts: string[] = [];
            if (res.created > 0) {
                parts.push(
                    `Applied to ${res.created} ${res.created === 1 ? "listing" : "listings"}`,
                );
            }
            const skipsByReason = groupSkips(res.skipped);
            for (const [reason, n] of skipsByReason) {
                parts.push(`${n} ${SKIP_LABEL[reason]}`);
            }
            if (parts.length === 0) parts.push("Nothing to apply");

            if (res.created > 0) {
                toast.success(parts.join(" · "));
            } else {
                toast.error(parts.join(" · "));
            }

            clear();
            onClose();
            setCoverLetter("");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t submit your applications.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/30"
                onClick={() => !submitting && onClose()}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Apply to selected listings"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
                    "w-full max-w-md mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col max-h-[90vh]",
                )}
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border shrink-0">
                    <h2 className="text-[14px] font-semibold">
                        Apply to {count}{" "}
                        {count === 1 ? "listing" : "listings"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="px-5 py-4 space-y-4 overflow-y-auto">
                    <ul className="rounded-lg border border-border max-h-40 overflow-y-auto divide-y divide-border">
                        {listings.map((l) => (
                            <li
                                key={l.id}
                                className="px-3 py-2 text-[12.5px] flex items-center justify-between gap-2 min-w-0"
                            >
                                <span className="truncate font-medium">
                                    {l.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground truncate shrink-0">
                                    {l.company.name}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <label className="block">
                        <span className="block mb-1.5 text-[12.5px] font-medium">
                            Cover note{" "}
                            <span className="text-muted-foreground font-normal">
                                (optional — shared across all)
                            </span>
                        </span>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="One or two lines about why you’re a fit."
                            rows={3}
                            maxLength={COVER_LIMIT}
                            className={cn(
                                "w-full rounded-lg border bg-background px-3 py-2",
                                "text-[13px] placeholder:text-muted-foreground/70",
                                "outline-none focus:ring-3 focus:ring-foreground/5 resize-y min-h-16",
                                over
                                    ? "border-destructive/50 focus:border-destructive/60"
                                    : "border-border focus:border-foreground/40",
                            )}
                        />
                        <div
                            className={cn(
                                "mt-1 text-right text-[11px] tabular-nums",
                                over
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                            )}
                        >
                            {coverLetter.length}/{COVER_LIMIT}
                        </div>
                    </label>
                </div>

                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onClose}
                        disabled={submitting}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={submit}
                        disabled={submitting || over}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        {submitting
                            ? "Sending…"
                            : `Apply to ${count}`}
                    </Button>
                </footer>
            </div>
        </>
    );
}

const SKIP_LABEL: Record<ApplyBatchSkipReason, string> = {
    ALREADY_APPLIED: "already applied",
    OWN_COMPANY: "your own company",
    CLOSED: "closed",
    PAUSED: "paused",
    EXPIRED: "expired",
    TAKEN_DOWN: "removed",
    SCREENING_REQUIRED: "need answers — apply directly",
    NOT_FOUND: "not found",
};

function groupSkips(
    skipped: Array<{ listingId: string; reason: ApplyBatchSkipReason }>,
): Array<[ApplyBatchSkipReason, number]> {
    const counts = new Map<ApplyBatchSkipReason, number>();
    for (const s of skipped) {
        counts.set(s.reason, (counts.get(s.reason) ?? 0) + 1);
    }
    return Array.from(counts.entries());
}
