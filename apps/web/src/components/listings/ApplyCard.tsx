"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { listingApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { useMe } from "@/src/hooks/useMe";
import { cn } from "@/src/lib/utils";

const COVER_LIMIT = 150;
const ANSWER_LIMIT = 500;

export function ApplyCard({
    listingId,
    postedById,
    closed,
    applied,
    screeningQuestions = [],
    onApplied,
}: {
    listingId: string;
    postedById: string;
    closed: boolean;
    applied: boolean;
    screeningQuestions?: string[];
    onApplied: () => Promise<void> | void;
}) {
    const { me } = useMe();
    const [coverLetter, setCoverLetter] = useState<string>("");
    const [answers, setAnswers] = useState<string[]>(() =>
        screeningQuestions.map(() => ""),
    );
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Keep `answers` length in sync if the founder edits the listing while
    // the student is viewing.
    useEffect(() => {
        setAnswers((prev) => {
            if (prev.length === screeningQuestions.length) return prev;
            return screeningQuestions.map((_, i) => prev[i] ?? "");
        });
    }, [screeningQuestions]);

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
    const overAnswer =
        answers.find((a) => a.length > ANSWER_LIMIT) !== undefined;
    const missingAnswerIndex = screeningQuestions.length
        ? answers.findIndex((a) => a.trim().length === 0)
        : -1;
    const ready = missingAnswerIndex === -1 && !over && !overAnswer;

    async function submit() {
        if (over) {
            toast.error(
                `Keep your cover note under ${COVER_LIMIT} characters.`,
            );
            return;
        }
        if (overAnswer) {
            toast.error(
                `Keep each screening answer under ${ANSWER_LIMIT} characters.`,
            );
            return;
        }
        if (missingAnswerIndex !== -1) {
            toast.error(
                `Please answer question ${missingAnswerIndex + 1}.`,
            );
            return;
        }
        setSubmitting(true);
        try {
            await listingApi.apply(listingId, {
                coverLetter: coverLetter.trim() || undefined,
                screeningAnswers:
                    screeningQuestions.length > 0
                        ? answers.map((a) => a.trim())
                        : undefined,
            });
            await onApplied();
            setCoverLetter("");
            setAnswers(screeningQuestions.map(() => ""));
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
            {screeningQuestions.length > 0 && (
                <div className="space-y-2.5">
                    <div className="text-[12.5px] font-medium">
                        A few quick questions from the employer
                    </div>
                    {screeningQuestions.map((q, i) => {
                        const overThis = answers[i]!.length > ANSWER_LIMIT;
                        return (
                            <label key={i} className="block space-y-1">
                                <span className="block text-[12.5px] text-foreground/90">
                                    <span className="font-medium tabular-nums text-muted-foreground">
                                        Q{i + 1}.
                                    </span>{" "}
                                    {q}
                                </span>
                                <textarea
                                    value={answers[i]}
                                    onChange={(e) =>
                                        setAnswers((prev) =>
                                            prev.map((a, j) =>
                                                j === i ? e.target.value : a,
                                            ),
                                        )
                                    }
                                    rows={2}
                                    maxLength={ANSWER_LIMIT}
                                    placeholder="Your answer"
                                    className={cn(
                                        "w-full rounded-lg border bg-background px-3 py-2",
                                        "text-[13px] placeholder:text-muted-foreground/70",
                                        "outline-none focus:ring-3 focus:ring-foreground/5",
                                        "resize-y min-h-14 max-h-32",
                                        overThis
                                            ? "border-destructive/50 focus:border-destructive/60"
                                            : "border-border focus:border-foreground/40",
                                    )}
                                />
                                <div
                                    className={cn(
                                        "text-right text-[11px] tabular-nums",
                                        overThis
                                            ? "text-destructive"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {answers[i]!.length}/{ANSWER_LIMIT}
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

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
                disabled={submitting || !ready}
                className="w-full h-10 text-[13px] cursor-pointer"
            >
                {submitting
                    ? "Submitting…"
                    : screeningQuestions.length > 0 ||
                        coverLetter.trim().length > 0
                      ? "Submit application"
                      : "Apply in 1 click"}
            </Button>
        </div>
    );
}
