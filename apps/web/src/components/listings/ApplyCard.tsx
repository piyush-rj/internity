"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Check, Upload, X, Wand2 } from "lucide-react";
import {
    listingApi,
    resumeApi,
    type Resume,
    type ScreeningAnswer,
    type ScreeningQuestion,
} from "@/src/lib/api";
import {
    ScreeningAnswerInput,
    isAnswered,
} from "@/src/components/listings/ScreeningAnswerInput";
import { ApiClientError } from "@/src/lib/apiClient";
import { uploadAsset } from "@/src/lib/upload";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { useMe } from "@/src/hooks/useMe";
import { useAppliedStore } from "@/src/store/useAppliedStore";
import { useMyProfileStore } from "@/src/store/useMyProfileStore";
import { cn } from "@/src/lib/utils";

const COVER_LIMIT = 150;
const MAX_RESUMES = 4;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

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
    screeningQuestions?: ScreeningQuestion[];
    onApplied: () => Promise<void> | void;
}) {
    const { me } = useMe();
    const [open, setOpen] = useState<boolean>(false);

    if (me && me.id === postedById) {
        return <div></div>;
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
                    {screeningQuestions.length === 1 ? "question" : "questions"}{" "}
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
    screeningQuestions: ScreeningQuestion[];
    onApplied: () => Promise<void> | void;
}) {
    const hasQuestions = screeningQuestions.length > 0;
    const { me } = useMe();
    const profile = useMyProfileStore((s) => s.profile);
    const profileInitialized = useMyProfileStore((s) => s.initialized);
    const initProfile = useMyProfileStore((s) => s.init);
    const markApplied = useAppliedStore((s) => s.markApplied);

    useEffect(() => {
        if (open && !profileInitialized) void initProfile();
    }, [open, profileInitialized, initProfile]);

    const [coverLetter, setCoverLetter] = useState<string>("");
    const [answers, setAnswers] = useState<ScreeningAnswer[]>(() =>
        screeningQuestions.map(() => ({ value: "" })),
    );
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showResumeWarning, setShowResumeWarning] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers((prev) => {
            if (prev.length === screeningQuestions.length) return prev;
            return screeningQuestions.map((_, i) => prev[i] ?? { value: "" });
        });
        // load resumes when the dialog opens
        let cancelled = false;
        (async () => {
            try {
                const res = await resumeApi.list();
                if (cancelled) return;
                setResumes(res.items);
                const def = res.items.find((r) => r.isDefault) ?? res.items[0];
                setResumeId(def?.id ?? null);
            } catch {
                if (!cancelled) setResumes([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, screeningQuestions]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, submitting]);

    if (!open || !mounted) return null;

    const overCover = coverLetter.length > COVER_LIMIT;
    const missingAnswerIndex = hasQuestions
        ? screeningQuestions.findIndex((q, i) => !isAnswered(q, answers[i]))
        : -1;
    const ready = !overCover && missingAnswerIndex === -1;
    const selectedResume = resumes.find((r) => r.id === resumeId) ?? null;

    function onApplyClick() {
        if (overCover) {
            toast.error(
                `Keep your cover note under ${COVER_LIMIT} characters.`,
            );
            return;
        }
        if (missingAnswerIndex !== -1) {
            toast.error(`Please answer question ${missingAnswerIndex + 1}.`);
            return;
        }
        if (resumes.length === 0 && profileInitialized && !profile?.resumeUrl) {
            setShowResumeWarning(true);
            return;
        }
        void submit();
    }

    async function handleUploadFile(file: File) {
        setUploadError(null);
        if (file.type !== "application/pdf") {
            setUploadError("Only PDF files are supported.");
            return;
        }
        if (file.size > MAX_RESUME_BYTES) {
            setUploadError("File must be under 10 MB.");
            return;
        }
        if (file.size === 0) {
            setUploadError("That file looks empty.");
            return;
        }
        if (resumes.length >= MAX_RESUMES) {
            setUploadError(
                `You can keep up to ${MAX_RESUMES} resumes — manage them from the Resumes page.`,
            );
            return;
        }
        setUploading(true);
        try {
            const before = new Set(resumes.map((r) => r.id));
            await uploadAsset({ kind: "RESUME", file, fileName: file.name });
            const res = await resumeApi.list();
            setResumes(res.items);
            // select the freshly uploaded resume so it's used for this apply
            const created =
                res.items.find((r) => !before.has(r.id)) ??
                res.items.find((r) => r.isDefault) ??
                res.items[0];
            setResumeId(created?.id ?? null);
            toast.success("Resume uploaded.");
        } catch (err) {
            setUploadError(
                err instanceof ApiClientError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Upload failed.",
            );
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function submit() {
        setSubmitting(true);
        try {
            await listingApi.apply(listingId, {
                coverLetter: coverLetter.trim() || undefined,
                screeningAnswers: hasQuestions ? answers : undefined,
                resumeUrl: selectedResume?.url ?? undefined,
            });
            markApplied(listingId);
            await onApplied();
            toast.success("Application sent.");
            setCoverLetter("");
            setAnswers(screeningQuestions.map(() => ({ value: "" })));
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
                    "w-full max-w-lg mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col max-h-[90vh]",
                )}
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border shrink-0">
                    <h2 className="text-[14px] font-semibold">
                        Apply to this listing
                    </h2>
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
                                A few quick questions from the employer
                            </div>
                            {screeningQuestions.map((q, i) => (
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
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[12.5px] font-medium">
                                Cover note{" "}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </span>
                            {me?.lastCoverLetter &&
                                me.lastCoverLetter !== coverLetter && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverLetter(
                                                me.lastCoverLetter ?? "",
                                            );
                                            toast.success(
                                                "Filled in your last cover note. Tweak it for this role.",
                                            );
                                        }}
                                        className={cn(
                                            "inline-flex items-center gap-1 text-[11.5px] font-medium",
                                            "text-orange-600 hover:text-orange-700 cursor-pointer",
                                        )}
                                    >
                                        <Wand2 className="h-3 w-3" />
                                        Use my last cover note
                                    </button>
                                )}
                        </div>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
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

                    <section className="space-y-2">
                        <div className="text-[12.5px] font-medium">
                            Resume{" "}
                            <span className="text-muted-foreground font-normal">
                                {resumes.length > 0
                                    ? `(${resumes.length}/${MAX_RESUMES})`
                                    : "(none uploaded)"}
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void handleUploadFile(f);
                            }}
                        />
                        {resumes.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-[12px] text-muted-foreground rounded-md border border-border bg-secondary/40 px-3 py-2">
                                    You haven&rsquo;t uploaded any resume yet.
                                    Upload one now (PDF, max 10 MB) — most
                                    employers expect a resume.
                                </p>
                                <UploadResumeButton
                                    uploading={uploading}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    label="Upload resume"
                                />
                            </div>
                        ) : (
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
                                            name="resume"
                                            checked={r.id === resumeId}
                                            onChange={() => setResumeId(r.id)}
                                            className="h-3.5 w-3.5 accent-foreground"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12.5px] font-medium truncate">
                                                {r.fileName}
                                                {r.isDefault && (
                                                    <span className="ml-2 text-[10.5px] text-emerald-700">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {r.lastUsedAt
                                                    ? `Last used ${new Date(r.lastUsedAt).toLocaleDateString("en-IN")}`
                                                    : `Uploaded ${new Date(r.createdAt).toLocaleDateString("en-IN")}`}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                                {resumes.length < MAX_RESUMES && (
                                    <UploadResumeButton
                                        uploading={uploading}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        label="Upload another"
                                    />
                                )}
                            </div>
                        )}
                        {uploadError && (
                            <p className="text-[11.5px] text-destructive">
                                {uploadError}
                            </p>
                        )}
                    </section>
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
                        onClick={onApplyClick}
                        disabled={submitting || !ready}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        {submitting ? "Submitting…" : "Apply"}
                    </Button>
                </footer>
            </div>
            <ConfirmDialog
                open={showResumeWarning}
                title="Apply without a resume?"
                description="You haven't uploaded a resume to your profile. Most employers expect one. Continue with only your cover letter?"
                confirmLabel="Apply anyway"
                cancelLabel="Add resume first"
                busy={submitting}
                onCancel={() => setShowResumeWarning(false)}
                onConfirm={async () => {
                    setShowResumeWarning(false);
                    await submit();
                }}
            />
        </>,
        document.body,
    );
}

function UploadResumeButton({
    uploading,
    onClick,
    label,
}: {
    uploading: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={uploading}
            className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md",
                "border border-border bg-background text-[12.5px] font-medium",
                "hover:bg-secondary/40 transition-colors cursor-pointer",
                "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
        >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : label}
        </button>
    );
}
