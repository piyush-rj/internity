"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
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
    const [open, setOpen] = useState<boolean>(false);

    if (me && me.id === postedById) {
        return (
            <div></div>
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

    return (
        <>
            <Button
                type="button"
                variant="exec-dark"
                onClick={() => setOpen(true)}
                className="w-full h-10 text-[13px] cursor-pointer"
            >
                Apply now
            </Button>
            {screeningQuestions.length > 0 && (
                <p className="mt-1.5 text-[11.5px] text-muted-foreground text-center">
                    {screeningQuestions.length} short{" "}
                    {screeningQuestions.length === 1
                        ? "question"
                        : "questions"}{" "}
                    from the employer
                </p>
            )}
            <ApplyDialog
                open={open}
                onClose={() => setOpen(false)}
                listingId={listingId}
                screeningQuestions={screeningQuestions}
                onApplied={onApplied}
            />
        </>
    );
}

/* ------------------------------- Dialog ---------------------------------- */

type Step = "questions" | "cover";

function ApplyDialog({
    open,
    onClose,
    listingId,
    screeningQuestions,
    onApplied,
}: {
    open: boolean;
    onClose: () => void;
    listingId: string;
    screeningQuestions: string[];
    onApplied: () => Promise<void> | void;
}) {
    const hasQuestions = screeningQuestions.length > 0;

    const [coverLetter, setCoverLetter] = useState<string>("");
    const [answers, setAnswers] = useState<string[]>(() =>
        screeningQuestions.map(() => ""),
    );
    const [step, setStep] = useState<Step>(
        hasQuestions ? "questions" : "cover",
    );
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Reset the form and the step pointer whenever the dialog opens fresh.
    // Also keeps the `answers` array length in lock-step with the listing's
    // questions if the founder edited them while the dialog was closed.
    useEffect(() => {
        if (!open) return;
        setStep(hasQuestions ? "questions" : "cover");
        setAnswers((prev) => {
            if (prev.length === screeningQuestions.length) return prev;
            return screeningQuestions.map((_, i) => prev[i] ?? "");
        });
    }, [open, hasQuestions, screeningQuestions]);

    // Esc to close (when not submitting).
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, submitting]);

    // Render nothing until mounted in the browser — createPortal needs
    // document.body, which doesn't exist during SSR.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!open || !mounted) return null;

    const overCover = coverLetter.length > COVER_LIMIT;
    const overAnswer =
        answers.find((a) => a.length > ANSWER_LIMIT) !== undefined;
    const missingAnswerIndex = hasQuestions
        ? answers.findIndex((a) => a.trim().length === 0)
        : -1;
    const questionsReady =
        !overAnswer && missingAnswerIndex === -1;
    const coverReady = !overCover;

    function goToCoverStep() {
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
        setStep("cover");
    }

    async function submit() {
        if (overCover) {
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
                screeningAnswers: hasQuestions
                    ? answers.map((a) => a.trim())
                    : undefined,
            });
            await onApplied();
            toast.success("Application sent.");
            setCoverLetter("");
            setAnswers(screeningQuestions.map(() => ""));
            onClose();
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

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-100 bg-black/30"
                onClick={() => !submitting && onClose()}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Apply to this listing"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl",
                    "flex flex-col max-h-[90vh]",
                )}
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold">
                            Apply to this listing
                        </h2>
                        {/* {hasQuestions && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                Step {step === "questions" ? 1 : 2} of 2 ·{" "}
                                {step === "questions"
                                    ? "Screening questions"
                                    : "Cover note"}
                            </div>
                        )} */}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 px-5 py-4 overflow-y-auto">
                    {step === "questions" && hasQuestions && (
                        <section className="space-y-3">
                            <div className="text-[12.5px] font-medium">
                                A few quick questions from the employer
                            </div>
                            {screeningQuestions.map((q, i) => {
                                const overThis =
                                    answers[i]!.length > ANSWER_LIMIT;
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
                                                        j === i
                                                            ? e.target.value
                                                            : a,
                                                    ),
                                                )
                                            }
                                            rows={3}
                                            maxLength={ANSWER_LIMIT}
                                            placeholder="Your answer"
                                            className={cn(
                                                "w-full rounded-lg border bg-background px-3 py-2",
                                                "text-[13px] placeholder:text-muted-foreground/70",
                                                "outline-none focus:ring-3 focus:ring-foreground/5",
                                                "resize-none h-24",
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
                        </section>
                    )}

                    {step === "cover" && (
                        <label className="block space-y-1">
                            <span className="block text-[12.5px] font-medium">
                                Cover note{" "}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </span>
                            <textarea
                                value={coverLetter}
                                onChange={(e) =>
                                    setCoverLetter(e.target.value)
                                }
                                placeholder="One or two lines about why you’re a great fit. Skip if you just want to apply."
                                rows={3}
                                maxLength={COVER_LIMIT}
                                className={cn(
                                    "w-full rounded-lg border bg-background px-3 py-2",
                                    "text-[13px] placeholder:text-muted-foreground/70",
                                    "outline-none focus:ring-3 focus:ring-foreground/5",
                                    "resize-none h-24",
                                    overCover
                                        ? "border-destructive/50 focus:border-destructive/60"
                                        : "border-border focus:border-foreground/40",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-right text-[11px] tabular-nums",
                                    overCover
                                        ? "text-destructive"
                                        : "text-muted-foreground",
                                )}
                            >
                                {coverLetter.length}/{COVER_LIMIT}
                            </div>
                        </label>
                    )}
                </div>

                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
                    {step === "questions" ? (
                        <>
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
                                onClick={goToCoverStep}
                                disabled={submitting || !questionsReady}
                                className="h-9 px-3 text-[12.5px] cursor-pointer"
                            >
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="exec-light"
                                onClick={
                                    hasQuestions
                                        ? () => setStep("questions")
                                        : onClose
                                }
                                disabled={submitting}
                                className="h-9 px-3 text-[12.5px] cursor-pointer"
                            >
                                {hasQuestions ? "Back" : "Cancel"}
                            </Button>
                            <Button
                                type="button"
                                variant="exec-dark"
                                onClick={submit}
                                disabled={submitting || !coverReady}
                                className="h-9 px-3 text-[12.5px] cursor-pointer"
                            >
                                {submitting ? "Submitting…" : "Apply"}
                            </Button>
                        </>
                    )}
                </footer>
            </div>
        </>,
        document.body,
    );
}
