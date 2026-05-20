"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Check,
    ChevronDown,
    ChevronUp,
    Mail,
    MessageSquare,
    X,
} from "lucide-react";
import { PiArrowSquareOut, PiClock, PiMapPin, PiPhone } from "react-icons/pi";
import {
    chatApi,
    type ApplicantWithStudent,
    type ApplicationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type DecidedStatus = Exclude<ApplicationStatus, "WITHDRAWN">;

const statusOptions: { value: DecidedStatus; label: string }[] = [
    { value: "APPLIED", label: "Applied" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "HIRED", label: "Hired" },
    { value: "REJECTED", label: "Rejected" },
];

const statusStyles: Record<ApplicationStatus, string> = {
    APPLIED: "bg-zinc-100 text-zinc-700 border-zinc-200",
    SHORTLISTED: "bg-amber-50 text-amber-700 border-amber-200",
    INTERVIEW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HIRED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    WITHDRAWN: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

export function ApplicantCard({
    applicant,
    onUpdateStatus,
}: {
    applicant: ApplicantWithStudent;
    onUpdateStatus: (id: string, status: DecidedStatus) => Promise<void>;
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState(false);
    const [messaging, setMessaging] = useState(false);

    const { student } = applicant;
    const profile = student.studentProfile;
    const displayName =
        `${profile?.firstName ?? ""}${profile?.lastName ? " " + profile.lastName : ""}`.trim() ||
        student.name;
    const isWithdrawn = applicant.status === "WITHDRAWN";
    const isDecided =
        applicant.status === "HIRED" ||
        applicant.status === "REJECTED" ||
        isWithdrawn;

    async function changeStatus(next: DecidedStatus) {
        if (busy || next === applicant.status || isWithdrawn) return;
        setBusy(true);
        try {
            await onUpdateStatus(applicant.id, next);
        } finally {
            setBusy(false);
        }
    }

    async function startChat() {
        if (messaging || isWithdrawn) return;
        setMessaging(true);
        try {
            const { id } = await chatApi.start_conversation(applicant.id);
            router.push(`/home/messages?cid=${id}`);
        } catch (err) {
            // Surface the failure inline — anything else would be silent.
            alert(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t open chat.",
            );
        } finally {
            setMessaging(false);
        }
    }

    return (
        <div className="px-5 py-4 hover:bg-secondary/40 transition-colors">
            <div className="flex items-start gap-4">
                <Avatar name={displayName} image={student.image ?? null} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={`/student/${student.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[14px] font-medium truncate hover:underline"
                        >
                            {displayName}
                        </Link>
                        {isWithdrawn ? (
                            <StatusBadge status={applicant.status} />
                        ) : (
                            <select
                                value={applicant.status}
                                onChange={(e) =>
                                    changeStatus(
                                        e.target.value as DecidedStatus,
                                    )
                                }
                                disabled={busy}
                                className={cn(
                                    "h-7 rounded-md border px-2 pr-6 text-[11px] font-medium appearance-none",
                                    "outline-none focus:ring-3 focus:ring-foreground/10",
                                    statusStyles[applicant.status],
                                )}
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                        </span>
                        {profile?.phone && (
                            <span className="inline-flex items-center gap-1">
                                <PiPhone className="h-3 w-3" />
                                {profile.phone}
                            </span>
                        )}
                        {profile?.city && (
                            <span className="inline-flex items-center gap-1">
                                <PiMapPin className="h-3 w-3" />
                                {profile.city}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <PiClock className="h-3 w-3" />
                            Applied {formatDate(applicant.appliedAt)}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                        {applicant.coverLetter && (
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                            >
                                {expanded
                                    ? "Hide cover letter"
                                    : "Read cover letter"}
                                {expanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                ) : (
                                    <ChevronDown className="h-3 w-3" />
                                )}
                            </button>
                        )}
                        <Link
                            href={`/student/${student.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                        >
                            View profile
                            <PiArrowSquareOut className="h-3 w-3" />
                        </Link>
                        <button
                            type="button"
                            onClick={startChat}
                            disabled={messaging || isWithdrawn}
                            className={cn(
                                "inline-flex items-center gap-1 text-[12px] font-medium",
                                "text-muted-foreground hover:text-foreground",
                                "disabled:opacity-50 disabled:pointer-events-none",
                            )}
                        >
                            <MessageSquare className="h-3 w-3" />
                            {messaging ? "Opening…" : "Message"}
                        </button>

                        {!isDecided && (
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => changeStatus("REJECTED")}
                                    disabled={busy}
                                    className={cn(
                                        "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[12px] font-medium",
                                        "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
                                        "disabled:opacity-50 disabled:pointer-events-none",
                                    )}
                                >
                                    <X className="h-3 w-3" />
                                    Reject
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeStatus("SHORTLISTED")}
                                    disabled={
                                        busy ||
                                        applicant.status === "SHORTLISTED"
                                    }
                                    className={cn(
                                        "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[12px] font-medium",
                                        "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700",
                                        "disabled:opacity-50 disabled:pointer-events-none",
                                    )}
                                >
                                    <Check className="h-3 w-3" />
                                    {applicant.status === "SHORTLISTED"
                                        ? "Approved"
                                        : "Approve"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {expanded && applicant.coverLetter && (
                <div className="mt-3 ml-14 rounded-lg border border-border bg-background px-3 py-2.5 text-[12.5px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {applicant.coverLetter}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
    const labels: Record<ApplicationStatus, string> = {
        APPLIED: "Applied",
        SHORTLISTED: "Shortlisted",
        INTERVIEW: "Interview",
        HIRED: "Hired",
        REJECTED: "Rejected",
        WITHDRAWN: "Withdrawn",
    };
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                statusStyles[status],
            )}
        >
            {labels[status]}
        </span>
    );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
    if (image) {
        return (
            <span className="relative h-15 w-15 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                <Image
                    src={image}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover"
                />
            </span>
        );
    }
    return (
        <span
            className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                "bg-linear-to-br from-pink-400 to-violet-500",
                "text-white text-[14px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
