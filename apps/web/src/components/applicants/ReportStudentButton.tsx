"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Flag, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { reportApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { cn } from "@/src/lib/utils";

const REASON_MAX = 1500;

// Employer-facing report button shown on each applicant card. Targets the
// student's userId via the same /report endpoint students use to report
// listings. Renders nothing for non-employers or when the target student
// has already deleted their account (no point reporting a ghost).
export function ReportStudentButton({
    studentId,
    studentName,
    disabled = false,
}: {
    studentId: string;
    studentName: string;
    disabled?: boolean;
}) {
    const { me } = useMe();
    const [open, setOpen] = useState(false);

    if (!me || me.role !== "EMPLOYER") return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={disabled}
                aria-label={`Report ${studentName}`}
                title={`Report ${studentName} to platform admins`}
                className={cn(
                    "inline-flex items-center gap-1 text-[12px] font-medium",
                    "text-muted-foreground hover:text-rose-600 transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                )}
            >
                <Flag className="h-3 w-3" />
                Report
            </button>
            {open && (
                <ReportDialog
                    studentId={studentId}
                    studentName={studentName}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

function ReportDialog({
    studentId,
    studentName,
    onClose,
}: {
    studentId: string;
    studentName: string;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const trimmed = reason.trim();
    const tooShort = trimmed.length < 10;
    const tooLong = trimmed.length > REASON_MAX;

    async function submit() {
        if (tooShort || tooLong) {
            toast.error(
                tooShort
                    ? "Add a few more words explaining the issue."
                    : "Keep your report under 1500 characters.",
            );
            return;
        }
        setSubmitting(true);
        try {
            await reportApi.create({
                targetType: "STUDENT",
                targetStudentId: studentId,
                reason: trimmed,
            });
            toast.success("Report submitted. Our team will review it.");
            onClose();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't submit the report.",
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
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101 w-full max-w-md mx-4 rounded-lg border border-border bg-background shadow-2xl flex flex-col"
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border">
                    <h2 className="text-[14px] font-semibold">
                        Report {studentName}
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
                <div className="px-5 py-4">
                    <label className="block space-y-1">
                        <span className="block text-[12.5px] font-medium">
                            What&rsquo;s wrong with this applicant?
                        </span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={6}
                            maxLength={REASON_MAX}
                            placeholder="Fake profile, harassment, spam applications, threatening messages, misrepresented credentials…"
                            className={cn(
                                "w-full rounded-lg border bg-background px-3 py-2",
                                "text-[13px] placeholder:text-muted-foreground/70",
                                "outline-none focus:ring-3 focus:ring-foreground/5",
                                "resize-y min-h-32",
                                tooLong
                                    ? "border-destructive/50 focus:border-destructive/60"
                                    : "border-border focus:border-foreground/40",
                            )}
                        />
                        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                            <span>
                                {tooShort && trimmed.length > 0
                                    ? "Add more detail to help us review."
                                    : ""}
                            </span>
                            <span className={cn(tooLong && "text-destructive")}>
                                {reason.length}/{REASON_MAX}
                            </span>
                        </div>
                    </label>
                    <p className="mt-3 text-[11.5px] text-muted-foreground leading-relaxed">
                        Reports are reviewed by SpiderSkill admins, not the
                        applicant. False reports may affect your company&rsquo;s
                        standing.
                    </p>
                </div>
                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
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
                        disabled={submitting || tooShort || tooLong}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        {submitting ? "Sending…" : "Submit report"}
                    </Button>
                </footer>
            </div>
        </>,
        document.body,
    );
}
