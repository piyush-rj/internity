"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
    PiCalendarBlankFill,
    PiInfoFill,
    PiPhoneFill,
    PiVideoCameraFill,
} from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import {
    interviewApi,
    type InterviewType,
    type ApplicantWithStudent,
} from "@/src/lib/api";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type Props = {
    open: boolean;
    applicant: ApplicantWithStudent;
    companyName: string;
    listingTitle: string;
    onClose: () => void;
    onScheduled: () => void;
};

export function ScheduleInterviewDialog({
    open,
    applicant,
    companyName,
    listingTitle,
    onClose,
    onScheduled,
}: Props) {
    const { profile: employerProfile } = useMyEmployer();

    const candidateName = useMemo(() => {
        const p = applicant.student.studentProfile;
        return (
            `${p?.firstName ?? ""}${p?.lastName ? " " + p.lastName : ""}`.trim() ||
            applicant.student.name ||
            applicant.student.email ||
            "Candidate"
        );
    }, [applicant]);

    const candidatePhone = applicant.student.studentProfile?.phone ?? null;

    const [title, setTitle] = useState("");
    const [type, setType] = useState<InterviewType>("VIDEO");
    const [meetingLink, setMeetingLink] = useState("");
    const [hostPhone, setHostPhone] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle("");
        setType("VIDEO");
        setMeetingLink("");
        setHostPhone(employerProfile?.phone ?? "");
        setDate("");
        setStartTime("");
        setEndTime("");
        setDescription(defaultDescription(candidateName, companyName));
    }, [open, candidateName, companyName, employerProfile?.phone]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);
    if (!open || !mounted) return null;

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (submitting) return;

        const t = title.trim();
        if (t.length < 3) {
            toast.error("Add a short title for the interview");
            return;
        }
        if (!date) {
            toast.error("Pick an interview date");
            return;
        }
        if (!startTime || !endTime) {
            toast.error("Pick a start and end time");
            return;
        }
        const start = combineLocalDateTime(date, startTime);
        const end = combineLocalDateTime(date, endTime);
        if (end.getTime() <= start.getTime()) {
            toast.error("End time must be after start time");
            return;
        }
        if (start.getTime() < Date.now() - 60_000) {
            toast.error("Interview can't be in the past");
            return;
        }
        if (type === "VIDEO") {
            const link = meetingLink.trim();
            if (!link) {
                toast.error("Paste a meeting link (Meet / Zoom / Teams)");
                return;
            }
            if (!isHttpUrl(link)) {
                toast.error("Meeting link must start with http:// or https://");
                return;
            }
        }
        if (type === "PHONE" && !hostPhone.trim()) {
            toast.error(
                "Share your phone number so the candidate can reach you",
            );
            return;
        }

        setSubmitting(true);
        try {
            await interviewApi.schedule({
                applicationId: applicant.id,
                title: t,
                type,
                scheduledAt: start.toISOString(),
                endsAt: end.toISOString(),
                meetingLink: type === "VIDEO" ? meetingLink.trim() : undefined,
                hostPhone: hostPhone.trim() || undefined,
                description: description.trim() || undefined,
            });
            toast.success("Interview scheduled");
            onScheduled();
            onClose();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t schedule the interview.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-100 bg-black/40"
                onClick={onClose}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Schedule interview"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-xl mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col max-h-[92vh]",
                )}
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border shrink-0">
                    <h2 className="text-[14.5px] font-semibold inline-flex items-center gap-2">
                        <PiCalendarBlankFill className="h-4 w-4 text-orange-600" />
                        Schedule Interview
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <form
                    onSubmit={onSubmit}
                    className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                >
                    <div className="flex items-center gap-2 text-[12.5px]">
                        <span className="text-muted-foreground">To:</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 font-medium">
                            {candidateName}
                        </span>
                        <span className="text-muted-foreground truncate">
                            · {listingTitle}
                        </span>
                    </div>

                    <Field label="Add Title" htmlFor="iv-title" required>
                        <input
                            id="iv-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. First-round interview with the founder"
                            maxLength={120}
                            className={inputClass}
                            autoFocus
                        />
                    </Field>

                    <Field label="Interview Type" required>
                        <div className="flex gap-2">
                            <TypeOption
                                active={type === "VIDEO"}
                                onClick={() => setType("VIDEO")}
                                icon={
                                    <PiVideoCameraFill className="h-3.5 w-3.5" />
                                }
                                label="Video call"
                                recommended
                            />
                            <TypeOption
                                active={type === "PHONE"}
                                onClick={() => setType("PHONE")}
                                icon={<PiPhoneFill className="h-3.5 w-3.5" />}
                                label="Phone"
                            />
                        </div>
                    </Field>

                    {type === "PHONE" && (
                        <Notice tone="amber">
                            Video interviews have a 5× higher candidate turn-up
                            rate than phone interviews. Consider scheduling the
                            first round as video for faster hiring.
                        </Notice>
                    )}

                    {type === "VIDEO" && (
                        <Field
                            label="Meeting link"
                            htmlFor="iv-link"
                            required
                            help="Create a meeting on Meet, Zoom or Teams and paste the link."
                        >
                            <input
                                id="iv-link"
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                className={inputClass}
                            />
                        </Field>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field
                            label="Interview date"
                            htmlFor="iv-date"
                            required
                        >
                            <input
                                id="iv-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={todayIsoDate()}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Time" required>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                    className={cn(inputClass, "flex-1")}
                                    aria-label="Start time"
                                />
                                <span className="text-[12px] text-muted-foreground">
                                    to
                                </span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className={cn(inputClass, "flex-1")}
                                    aria-label="End time"
                                />
                            </div>
                        </Field>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-[12px]">
                        <div className="text-muted-foreground">
                            Applicant&rsquo;s contact number
                        </div>
                        <div className="mt-0.5 font-medium inline-flex items-center gap-1.5">
                            <PiPhoneFill className="h-3 w-3 text-muted-foreground" />
                            {candidatePhone ?? (
                                <span className="text-muted-foreground italic">
                                    Not shared
                                </span>
                            )}
                        </div>
                    </div>

                    <Field
                        label="Share your contact number"
                        htmlFor="iv-host-phone"
                        help="Letting the candidate know your number helps them respond faster."
                        required={type === "PHONE"}
                    >
                        <input
                            id="iv-host-phone"
                            type="tel"
                            value={hostPhone}
                            onChange={(e) => setHostPhone(e.target.value)}
                            placeholder="+91 9XXXXXXXXX"
                            className={inputClass}
                        />
                    </Field>

                    <Field
                        label="Add description"
                        htmlFor="iv-desc"
                        help={`${description.length}/1500`}
                    >
                        <textarea
                            id="iv-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            maxLength={1500}
                            className={cn(
                                inputClass,
                                "resize-y leading-relaxed",
                            )}
                        />
                    </Field>
                </form>

                <footer className="px-5 py-3 border-t border-border shrink-0">
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="w-full h-10 text-[13px] cursor-pointer"
                    >
                        {submitting ? "Scheduling…" : "Schedule Interview"}
                    </Button>
                </footer>
            </div>
        </>,
        document.body,
    );
}

const inputClass = cn(
    "w-full h-10 rounded-lg border border-border bg-background px-3",
    "text-[13px] outline-none focus:ring-2 focus:ring-orange-300/60 focus:border-orange-300",
    "placeholder:text-muted-foreground/70",
);

function Field({
    label,
    htmlFor,
    required,
    help,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    help?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <label
                    htmlFor={htmlFor}
                    className="text-[12px] font-medium text-foreground"
                >
                    {label}
                    {required && (
                        <span className="text-orange-600 ml-0.5">*</span>
                    )}
                </label>
                {help && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                        {help}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function TypeOption({
    active,
    onClick,
    icon,
    label,
    recommended,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    recommended?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative inline-flex items-center gap-1.5 rounded-full border px-3.5 h-9 text-[12.5px] font-medium cursor-pointer",
                "transition-colors",
                active
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-border bg-background text-foreground hover:bg-secondary",
            )}
        >
            {recommended && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200 text-[8px] font-medium px-1.25 py-px">
                    Recommended
                </span>
            )}
            {icon}
            {label}
        </button>
    );
}

function Notice({
    tone = "amber",
    children,
}: {
    tone?: "amber";
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border px-3 py-2 text-[12px] flex items-start gap-2",
                tone === "amber"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "",
            )}
        >
            <PiInfoFill className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">{children}</p>
        </div>
    );
}

function combineLocalDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
}

function todayIsoDate(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function isHttpUrl(s: string): boolean {
    try {
        const u = new URL(s);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function defaultDescription(name: string, company: string): string {
    return `Hi ${name.split(" ")[0]},

Looking forward to chatting with you about the role at ${company}. Please confirm your availability or let me know if you'd like to reschedule.

Thanks!`;
}
