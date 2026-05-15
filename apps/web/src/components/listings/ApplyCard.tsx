"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { listingApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export function ApplyCard({
    listingId,
    closed,
    applied,
    onApplied,
}: {
    listingId: string;
    closed: boolean;
    applied: boolean;
    onApplied: () => Promise<void> | void;
}) {
    const [open, setOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (applied) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 flex items-start gap-2 text-[13px]">
                <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                    <p className="font-medium text-emerald-800">
                        You’ve applied
                    </p>
                    <p className="mt-0.5 text-[12px] text-emerald-700/80">
                        Track its status from your applications inbox.
                    </p>
                </div>
            </div>
        );
    }

    if (closed) {
        return (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-3 text-[13px] text-muted-foreground">
                Applications closed for this listing.
            </div>
        );
    }

    async function handleSubmit() {
        setSubmitting(true);
        setError(null);
        try {
            await listingApi.apply(listingId, {
                coverLetter: coverLetter.trim() || undefined,
            });
            await onApplied();
            setOpen(false);
            setCoverLetter("");
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t submit your application.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) {
        return (
            <Button
                type="button"
                variant="exec-dark"
                onClick={() => setOpen(true)}
                className="w-full h-10 text-[13px] cursor-pointer"
            >
                Apply now
            </Button>
        );
    }

    return (
        <div className="space-y-3">
            <label className="block">
                <span className="block mb-1.5 text-[12.5px] font-medium">
                    Cover letter
                    <span className="ml-1 text-muted-foreground font-normal">
                        (optional)
                    </span>
                </span>
                <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why are you a great fit? A few lines is enough."
                    rows={5}
                    maxLength={1200}
                    className={cn(
                        "w-full rounded-lg border border-border bg-background px-3 py-2",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                        "resize-y min-h-28",
                    )}
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                    {coverLetter.length}/1200
                </div>
            </label>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={() => {
                        setOpen(false);
                        setError(null);
                    }}
                    disabled={submitting}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-9 text-[12.5px] cursor-pointer"
                >
                    {submitting ? "Submitting…" : "Submit application"}
                </Button>
            </div>
        </div>
    );
}
