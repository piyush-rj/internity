"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
    listingApi,
    resumeApi,
    type ListingWithCompany,
    type Resume,
    type ScreeningAnswer,
    type ScreeningQuestion,
} from "@/src/lib/api";
import {
    ScreeningAnswerInput,
    isAnswered,
} from "@/src/components/listings/ScreeningAnswerInput";
import { ApiClientError } from "@/src/lib/apiClient";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { useMe } from "@/src/hooks/useMe";
import { useAppliedStore } from "@/src/store/useAppliedStore";
import { useMultiSelectStore } from "@/src/store/useMultiSelectStore";
import { cn } from "@/src/lib/utils";

const COVER_LIMIT = 150;

type ListingWithScreening = ListingWithCompany & {
    screeningQuestions: ScreeningQuestion[];
};

// Floating bottom bar to apply across multiple selected listings, then a
// sequential overlay card per company with cover letter + screening +
// resume picker. Each card submission is a separate POST so each listing
// gets its own answers, cover letter, and resume choice.
export function MultiApplyBar() {
    const { me } = useMe();
    const selected = useMultiSelectStore((s) => s.selected);
    const clear = useMultiSelectStore((s) => s.clear);
    const [flowOpen, setFlowOpen] = useState(false);

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
                    onClick={() => setFlowOpen(true)}
                    className="h-8 px-3 text-[12.5px] cursor-pointer"
                >
                    Apply to {count}
                </Button>
            </div>

            {flowOpen && (
                <SequentialApplyFlow
                    onDone={() => {
                        setFlowOpen(false);
                        clear();
                    }}
                />
            )}
        </>
    );
}

function SequentialApplyFlow({ onDone }: { onDone: () => void }) {
    const selected = useMultiSelectStore((s) => s.selected);
    const removeOne = useMultiSelectStore((s) => s.remove);
    const markApplied = useAppliedStore((s) => s.markApplied);

    const baseList = useMemo(() => Array.from(selected.values()), [selected]);

    const [queue, setQueue] = useState<ListingWithScreening[]>([]);
    const [loading, setLoading] = useState(true);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [defaultResumeId, setDefaultResumeId] = useState<string | null>(null);
    const [skipped, setSkipped] = useState(0);
    const [applied, setApplied] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [details, resumeList] = await Promise.all([
                    Promise.all(
                        baseList.map((l) =>
                            listingApi.get(l.id).then((res) => res.listing),
                        ),
                    ),
                    resumeApi.list().catch(() => ({ items: [] as Resume[] })),
                ]);
                if (cancelled) return;
                const enriched: ListingWithScreening[] = details.map(
                    (full, i) => ({
                        ...baseList[i]!,
                        screeningQuestions:
                            (full.screeningQuestions as ScreeningQuestion[]) ??
                            [],
                    }),
                );
                setQueue(enriched);
                setResumes(resumeList.items);
                const def =
                    resumeList.items.find((r) => r.isDefault) ??
                    resumeList.items[0];
                setDefaultResumeId(def?.id ?? null);
            } catch {
                if (!cancelled) toast.error("Couldn't load the selection.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const current = queue[0] ?? null;
    const total = baseList.length;
    const progress = total - queue.length + 1;

    function handleApplied(listingId: string) {
        markApplied(listingId);
        removeOne(listingId);
        setApplied((n) => n + 1);
        setQueue((q) => q.slice(1));
    }

    function handleSkip(listingId: string) {
        removeOne(listingId);
        setSkipped((n) => n + 1);
        setQueue((q) => q.slice(1));
    }

    function handleClose() {
        if (applied === 0 && skipped === 0) {
            onDone();
            return;
        }
        toast.success(
            `${applied} applied${skipped > 0 ? ` · ${skipped} skipped` : ""}`,
        );
        onDone();
    }

    if (loading) {
        return createPortal(
            <Overlay onClose={handleClose}>
                <div className="p-6 text-center text-[13px] text-muted-foreground">
                    Loading your selections…
                </div>
            </Overlay>,
            document.body,
        );
    }

    if (!current) {
        return createPortal(
            <Overlay onClose={handleClose}>
                <div className="p-6 text-center space-y-2">
                    <div className="text-[14px] font-semibold">All done</div>
                    <p className="text-[12.5px] text-muted-foreground">
                        Applied to {applied}{" "}
                        {applied === 1 ? "listing" : "listings"}
                        {skipped > 0 ? ` · skipped ${skipped}` : ""}.
                    </p>
                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={handleClose}
                            className="h-9 px-4 text-[12.5px] cursor-pointer"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Overlay>,
            document.body,
        );
    }

    return createPortal(
        <Overlay onClose={handleClose}>
            <PerCompanyCard
                key={current.id}
                listing={current}
                resumes={resumes}
                defaultResumeId={defaultResumeId}
                progress={progress}
                total={total}
                onApplied={() => handleApplied(current.id)}
                onSkip={() => handleSkip(current.id)}
                onClose={handleClose}
            />
        </Overlay>,
        document.body,
    );
}

function Overlay({
    children,
    onClose,
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <>
            <div
                className="fixed inset-0 z-100 bg-black/30"
                onClick={onClose}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-lg mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col max-h-[90vh]",
                )}
            >
                {children}
            </div>
        </>
    );
}

function PerCompanyCard({
    listing,
    resumes,
    defaultResumeId,
    progress,
    total,
    onApplied,
    onSkip,
    onClose,
}: {
    listing: ListingWithScreening;
    resumes: Resume[];
    defaultResumeId: string | null;
    progress: number;
    total: number;
    onApplied: () => void;
    onSkip: () => void;
    onClose: () => void;
}) {
    const hasQuestions = listing.screeningQuestions.length > 0;
    const [answers, setAnswers] = useState<ScreeningAnswer[]>(() =>
        listing.screeningQuestions.map(() => ({ value: "" })),
    );
    const [coverLetter, setCoverLetter] = useState("");
    const [resumeId, setResumeId] = useState<string | null>(defaultResumeId);
    const [submitting, setSubmitting] = useState(false);

    const overCover = coverLetter.length > COVER_LIMIT;
    const missingAnswerIndex = hasQuestions
        ? listing.screeningQuestions.findIndex(
              (q, i) => !isAnswered(q, answers[i]),
          )
        : -1;
    const ready = !overCover && missingAnswerIndex === -1;
    const selectedResume = resumes.find((r) => r.id === resumeId) ?? null;

    async function submit() {
        if (overCover) {
            toast.error(`Cover note over ${COVER_LIMIT} chars.`);
            return;
        }
        if (missingAnswerIndex !== -1) {
            toast.error(`Answer question ${missingAnswerIndex + 1}.`);
            return;
        }
        setSubmitting(true);
        try {
            await listingApi.apply(listing.id, {
                coverLetter: coverLetter.trim() || undefined,
                screeningAnswers: hasQuestions ? answers : undefined,
                resumeUrl: selectedResume?.url ?? undefined,
            });
            toast.success(`Applied to ${listing.company.name}`);
            onApplied();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't submit this application.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-border shrink-0">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground tabular-nums">
                        Step {progress} of {total}
                    </div>
                    <h2 className="text-[15px] font-semibold truncate">
                        Apply to {listing.company.name}
                    </h2>
                    <p className="text-[12px] text-muted-foreground truncate">
                        {formatListingTitle(listing.title)}
                    </p>
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

            <div className="flex-1 px-5 py-4 overflow-y-auto space-y-5">
                {hasQuestions && (
                    <section className="space-y-3">
                        <div className="text-[12.5px] font-medium">
                            Screening questions
                        </div>
                        {listing.screeningQuestions.map((q, i) => (
                            <ScreeningAnswerInput
                                key={i}
                                index={i}
                                question={q}
                                answer={answers[i]}
                                onChange={(next) =>
                                    setAnswers((prev) =>
                                        prev.map((a, j) =>
                                            j === i ? next : a,
                                        ),
                                    )
                                }
                            />
                        ))}
                    </section>
                )}

                <label className="block space-y-1">
                    <span className="block text-[12.5px] font-medium">
                        Cover note{" "}
                        <span className="text-muted-foreground font-normal">
                            (optional)
                        </span>
                    </span>
                    <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder={`Why are you a fit at ${listing.company.name}?`}
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

                {resumes.length > 0 && (
                    <section className="space-y-2">
                        <div className="text-[12.5px] font-medium">Resume</div>
                        <div className="space-y-1.5">
                            {resumes.map((r) => (
                                <label
                                    key={r.id}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer",
                                        r.id === resumeId
                                            ? "border-foreground/40 bg-secondary/50"
                                            : "border-border hover:bg-secondary/30",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name={`resume-${listing.id}`}
                                        checked={r.id === resumeId}
                                        onChange={() => setResumeId(r.id)}
                                        className="h-3.5 w-3.5 accent-foreground"
                                    />
                                    <span className="flex-1 min-w-0 text-[12.5px] truncate">
                                        {r.fileName}
                                        {r.isDefault && (
                                            <span className="ml-2 text-[10.5px] text-emerald-700">
                                                Default
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={onSkip}
                    disabled={submitting}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    Skip
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={submitting || !ready}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {submitting ? "Submitting…" : "Apply"}
                </Button>
            </footer>
        </>
    );
}
