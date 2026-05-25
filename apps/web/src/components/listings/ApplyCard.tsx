"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { listingApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { useMe } from "@/src/hooks/useMe";
import { cn } from "@/src/lib/utils";

const COVER_LIMIT = 150;

export function ApplyCard({
    listingId,
    postedById,
    closed,
    applied,
    onApplied,
}: {
    listingId: string;
    postedById: string;
    closed: boolean;
    applied: boolean;
    onApplied: () => Promise<void> | void;
}) {
    const { me } = useMe();
    const [coverLetter, setCoverLetter] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    if (me && me.id === postedById) {
        return (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-3 text-[13px] text-muted-foreground flex justify-center">
                This is your listing.
            </div>
        );
    }

    if (me && me.role !== "STUDENT") {
        return (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-3 text-[13px] text-muted-foreground">
                Switch to a student account to apply.
            </div>
        );
    }

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

    const remaining = COVER_LIMIT - coverLetter.length;
    const over = remaining < 0;

    async function submit() {
        const trimmed = coverLetter.trim();
        if (trimmed.length > COVER_LIMIT) {
            toast.error(
                `Keep your cover note under ${COVER_LIMIT} characters.`,
            );
            return;
        }
        setSubmitting(true);
        try {
            await listingApi.apply(listingId, {
                coverLetter: trimmed || undefined,
            });
            await onApplied();
            setCoverLetter("");
            toast.success("Application sent.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t submit your application.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-3">
            <label className="block">
                <span className="block mb-1.5 text-[12.5px] font-medium">
                    Cover note{" "}
                    <span className="text-muted-foreground font-normal">
                        (optional)
                    </span>
                </span>
                <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="One or two lines about why you’re a great fit. Skip if you just want to apply in 1 click."
                    rows={3}
                    maxLength={COVER_LIMIT}
                    className={cn(
                        "w-full rounded-lg border bg-background px-3 py-2",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:ring-3 focus:ring-foreground/5",
                        // Cap height so the textarea doesn't stretch with
                        // the parent column on listing pages with sparse
                        // detail. resize-y keeps user control within range.
                        "resize-y min-h-20 max-h-32",
                        over
                            ? "border-destructive/50 focus:border-destructive/60"
                            : "border-border focus:border-foreground/40",
                    )}
                />
                <div
                    className={cn(
                        "mt-1 text-right text-[11px] tabular-nums",
                        over ? "text-destructive" : "text-muted-foreground",
                    )}
                >
                    {coverLetter.length}/{COVER_LIMIT}
                </div>
            </label>

            <Button
                type="button"
                variant="exec-dark"
                onClick={submit}
                disabled={submitting || over}
                className="w-full h-10 text-[13px] cursor-pointer"
            >
                {submitting
                    ? "Submitting…"
                    : coverLetter.trim().length > 0
                      ? "Submit application"
                      : "Apply in 1 click"}
            </Button>
        </div>
    );
}
