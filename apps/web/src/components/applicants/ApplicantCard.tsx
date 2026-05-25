"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    CalendarClock,
    Check,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Trophy,
    X,
} from "lucide-react";
import {
    PiArrowSquareOut,
    PiClock,
    PiEnvelope,
    PiMapPin,
    PiPhone,
} from "react-icons/pi";
import {
    chatApi,
    type ApplicantWithStudent,
    type ApplicantStudentEducation,
    type ApplicantStudentExperience,
    type ApplicationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";
import { ScheduleInterviewDialog } from "./ScheduleInterviewDialog";

type DecidedStatus = Exclude<ApplicationStatus, "WITHDRAWN">;

const statusOptions: { value: DecidedStatus; label: string }[] = [
    { value: "APPLIED", label: "Applied" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "HIRED", label: "Hired" },
    { value: "REJECTED", label: "Rejected" },
];

const statusStyles: Record<ApplicationStatus, string> = {
    APPLIED: "bg-neutral-100 text-neutral-700 border-neutral-200",
    SHORTLISTED: "bg-orange-50 text-orange-700 border-orange-200",
    INTERVIEW: "bg-amber-50 text-amber-800 border-amber-200",
    HIRED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    WITHDRAWN: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

export function ApplicantCard({
    applicant,
    screeningQuestions = [],
    listingSkillTags = [],
    listingTitle = "",
    companyName = "",
    onUpdateStatus,
}: {
    applicant: ApplicantWithStudent;
    screeningQuestions?: string[];
    listingSkillTags?: string[];
    listingTitle?: string;
    companyName?: string;
    onUpdateStatus: (id: string, status: DecidedStatus) => Promise<void>;
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [busy, setBusy] = useState(false);
    const [messaging, setMessaging] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    const { student } = applicant;
    const profile = student.studentProfile;
    const displayName =
        `${profile?.firstName ?? ""}${profile?.lastName ? " " + profile.lastName : ""}`.trim() ||
        student.name ||
        "(no name)";
    const isWithdrawn = applicant.status === "WITHDRAWN";
    const isDecided =
        applicant.status === "HIRED" ||
        applicant.status === "REJECTED" ||
        isWithdrawn;

    const match = useMemo(
        () => computeMatch(profile?.skills ?? [], listingSkillTags),
        [profile?.skills, listingSkillTags],
    );

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
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t open chat.",
            );
        } finally {
            setMessaging(false);
        }
    }

    const primaryEducation = profile?.educations?.[0] ?? null;
    const skills = profile?.skills ?? [];
    const projects = profile?.projects ?? [];
    const experiences = profile?.experiences ?? [];
    const totalExperience = formatTotalExperience(experiences);
    const hasExpandableContent =
        !!applicant.coverLetter ||
        applicant.screeningAnswers.length > 0 ||
        projects.length > 0 ||
        experiences.length > 0;

    return (
        <>
        <div className="px-5 py-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-start gap-4">
                <Avatar name={displayName} image={student.image ?? null} />
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Link
                                href={`/student/${student.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[14px] font-semibold truncate hover:underline hover:text-orange-600 transition-colors"
                            >
                                {displayName}
                            </Link>
                            {match && (
                                <MatchBadge
                                    matched={match.matched}
                                    total={match.total}
                                />
                            )}
                            {applicant.seenAt &&
                                applicant.status === "APPLIED" && (
                                    <span className="text-[10.5px] text-muted-foreground">
                                        · Seen
                                    </span>
                                )}
                        </div>
                        {isWithdrawn ? (
                            <StatusPill status={applicant.status} />
                        ) : (
                            <label className="ml-auto shrink-0 flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">
                                    Change status:
                                </span>
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
                                        "outline-none focus:ring-3 focus:ring-orange-200/60 cursor-pointer",
                                        statusStyles[applicant.status],
                                    )}
                                >
                                    {statusOptions.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                        <Meta
                            icon={<PiEnvelope className="h-3 w-3" />}
                            text={student.email ?? "—"}
                        />
                        {profile?.phone && (
                            <Meta
                                icon={<PiPhone className="h-3 w-3" />}
                                text={profile.phone}
                            />
                        )}
                        {profile?.city && (
                            <Meta
                                icon={<PiMapPin className="h-3 w-3" />}
                                text={profile.city}
                            />
                        )}
                        <Meta
                            icon={<PiClock className="h-3 w-3" />}
                            text={`Applied ${formatDate(applicant.appliedAt)}`}
                        />
                    </div>
                </div>
            </div>

            <dl className="mt-4 sm:ml-14 space-y-2 text-[12.5px]">
                <Row label="Education">
                    {primaryEducation ? (
                        <EducationLine education={primaryEducation} />
                    ) : (
                        <Dim>Not provided</Dim>
                    )}
                </Row>
                {totalExperience && (
                    <Row label="Experience">
                        <span>{totalExperience}</span>
                    </Row>
                )}
                <Row label="Skills">
                    {skills.length > 0 ? (
                        <SkillChips
                            skills={skills.map((s) => s.skill.name)}
                            highlight={listingSkillTags}
                        />
                    ) : (
                        <Dim>Not provided</Dim>
                    )}
                </Row>
            </dl>

            <div className="mt-3 sm:ml-14 flex flex-wrap items-center gap-x-3 gap-y-2">
                {hasExpandableContent && (
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-600 hover:text-orange-700"
                    >
                        {expanded ? "Hide details" : expandLabel(applicant)}
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

                {!isDecided && (
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => changeStatus("REJECTED")}
                            disabled={busy}
                            className={cn(
                                "inline-flex items-center gap-1 h-8 px-3 rounded-md border text-[12px] font-medium",
                                "border-border bg-white text-foreground hover:bg-secondary",
                                "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                            )}
                        >
                            <X className="h-3 w-3" />
                            Reject
                        </button>
                        <NextStepsMenu
                            currentStatus={applicant.status}
                            busy={busy || messaging || isWithdrawn}
                            messaging={messaging}
                            onSchedule={() => setScheduling(true)}
                            onStartChat={startChat}
                            onAdvanceStatus={changeStatus}
                        />
                    </div>
                )}
            </div>

            {expanded && (
                <div className="mt-3 sm:ml-14 space-y-3">
                    {applicant.screeningAnswers.length > 0 && (
                        <Panel title="Answers">
                            <div className="divide-y divide-border">
                                {applicant.screeningAnswers.map((ans, i) => (
                                    <div key={i} className="py-2.5 first:pt-0">
                                        <div className="text-[11.5px] font-medium text-muted-foreground leading-snug">
                                            <span className="tabular-nums">
                                                Q{i + 1}.
                                            </span>{" "}
                                            {screeningQuestions[i] ??
                                                "(question not available)"}
                                        </div>
                                        <div className="mt-1 text-[12.5px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                            {ans || (
                                                <Dim>(no answer)</Dim>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {applicant.coverLetter && (
                        <Panel title="Cover note">
                            <div className="text-[12.5px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {applicant.coverLetter}
                            </div>
                        </Panel>
                    )}

                    {projects.length > 0 && (
                        <Panel title="Projects">
                            <ul className="space-y-1 text-[12.5px]">
                                {projects.map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex items-center gap-1.5"
                                    >
                                        {p.link ? (
                                            <a
                                                href={p.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-orange-600 hover:underline truncate"
                                            >
                                                {p.title}
                                            </a>
                                        ) : (
                                            <span className="truncate">
                                                {p.title}
                                            </span>
                                        )}
                                        {p.link && (
                                            <PiArrowSquareOut className="h-3 w-3 text-muted-foreground shrink-0" />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}

                    {experiences.length > 0 && (
                        <Panel title="Experience">
                            <ul className="space-y-1 text-[12.5px]">
                                {experiences.map((e) => (
                                    <li key={e.id} className="flex flex-col">
                                        <span className="font-medium">
                                            {e.title}{" "}
                                            <span className="text-muted-foreground font-normal">
                                                at {e.company}
                                            </span>
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {formatExperienceDates(e)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </div>
            )}
        </div>

        <ScheduleInterviewDialog
            open={scheduling}
            applicant={applicant}
            companyName={companyName}
            listingTitle={listingTitle}
            onClose={() => setScheduling(false)}
            onScheduled={() => {
                void onUpdateStatus(applicant.id, "INTERVIEW").catch(() => {});
            }}
        />
        </>
    );
}

function expandLabel(applicant: ApplicantWithStudent): string {
    const bits: string[] = [];
    if (applicant.screeningAnswers.length > 0) bits.push("answers");
    if (applicant.coverLetter) bits.push("cover");
    if (applicant.student.studentProfile?.projects.length) bits.push("projects");
    if (applicant.student.studentProfile?.experiences.length)
        bits.push("experience");
    if (bits.length === 0) return "Read more";
    if (bits.length === 1) return `Read ${bits[0]}`;
    if (bits.length === 2) return `Read ${bits[0]} + ${bits[1]}`;
    return "Read details";
}

function StatusPill({ status }: { status: ApplicationStatus }) {
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

function MatchBadge({
    matched,
    total,
}: {
    matched: number;
    total: number;
}) {
    const strong = total > 0 && matched / total >= 0.6;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                strong
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200",
            )}
            title={`${matched} of ${total} required skills`}
        >
            <span
                className={cn(
                    "h-1 w-1 rounded-full",
                    strong ? "bg-orange-500" : "bg-neutral-400",
                )}
            />
            {matched}/{total} skills
        </span>
    );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            {icon}
            <span className="truncate">{text}</span>
        </span>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[110px_1fr] sm:gap-3 sm:items-start">
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground sm:text-[12.5px] sm:normal-case sm:tracking-normal sm:pt-0.5">
                {label}
            </dt>
            <dd className="min-w-0 text-foreground/90">{children}</dd>
        </div>
    );
}

function Dim({ children }: { children: React.ReactNode }) {
    return <span className="text-muted-foreground/80">{children}</span>;
}

function EducationLine({
    education,
}: {
    education: ApplicantStudentEducation;
}) {
    const years = `${education.startYear}–${education.current ? "Present" : (education.endYear ?? "?")}`;
    const head = [education.degree, education.fieldOfStudy]
        .filter(Boolean)
        .join(" · ");
    return (
        <span className="leading-snug">
            <span className="font-medium">{head || education.degree}</span>
            <span className="text-muted-foreground"> ({years})</span>
            <span className="text-muted-foreground"> · </span>
            <span>{education.institute}</span>
        </span>
    );
}

function SkillChips({
    skills,
    highlight,
}: {
    skills: string[];
    highlight: string[];
}) {
    const max = 8;
    const visible = skills.slice(0, max);
    const overflow = skills.length - visible.length;
    const matchSet = new Set(highlight.map((s) => s.trim().toLowerCase()));
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((s) => {
                const matched = matchSet.has(s.trim().toLowerCase());
                return (
                    <span
                        key={s}
                        className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-medium",
                            matched
                                ? "bg-orange-100 text-orange-800"
                                : "bg-secondary text-foreground/80",
                        )}
                    >
                        {s}
                    </span>
                );
            })}
            {overflow > 0 && (
                <span className="text-[11px] text-muted-foreground">
                    +{overflow} more
                </span>
            )}
        </div>
    );
}

function Panel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="text-[11.5px] font-medium text-muted-foreground">
                {title}
            </div>
            <div className="mt-1.5">{children}</div>
        </div>
    );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
    if (image) {
        return (
            <span className="relative h-10 w-10 rounded-full overflow-hidden ring-1 ring-border shrink-0">
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
                "bg-linear-to-br from-orange-400 to-orange-600",
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

function formatExperienceDates(e: ApplicantStudentExperience): string {
    const start = formatYearMonth(e.startDate);
    if (e.current) return `${start} – Present`;
    if (e.endDate) return `${start} – ${formatYearMonth(e.endDate)}`;
    return start;
}

function formatYearMonth(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}

function formatTotalExperience(
    experiences: readonly ApplicantStudentExperience[],
): string | null {
    if (experiences.length === 0) return null;
    let totalMonths = 0;
    for (const e of experiences) {
        const start = new Date(e.startDate).getTime();
        const end = e.current
            ? Date.now()
            : e.endDate
              ? new Date(e.endDate).getTime()
              : null;
        if (end === null || Number.isNaN(start)) continue;
        const months = Math.max(
            0,
            Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.4)),
        );
        totalMonths += months;
    }
    if (totalMonths === 0) return null;
    if (totalMonths < 12) {
        return `${totalMonths} ${totalMonths === 1 ? "month" : "months"}`;
    }
    const years = Math.floor(totalMonths / 12);
    const rem = totalMonths % 12;
    if (rem === 0) return `${years} ${years === 1 ? "year" : "years"}`;
    return `${years}y ${rem}m`;
}

// returns matched/total skill match between student and listing tags
function computeMatch(
    studentSkills: Array<{ skill: { name: string } }>,
    listingTags: string[],
): { matched: number; total: number } | null {
    if (listingTags.length === 0) return null;
    const studentSet = new Set(
        studentSkills.map((s) => s.skill.name.trim().toLowerCase()),
    );
    let matched = 0;
    for (const t of listingTags) {
        if (studentSet.has(t.trim().toLowerCase())) matched += 1;
    }
    return { matched, total: listingTags.length };
}

/* ------------------------------ NextStepsMenu ----------------------------- */

// Returns the natural pipeline progression for a given status, or null when
// there's no automatic "next step" beyond what the dropdown's other actions
// already cover.
function nextStepFor(status: ApplicationStatus): {
    label: string;
    target: DecidedStatus;
} | null {
    if (status === "APPLIED") return { label: "Shortlist", target: "SHORTLISTED" };
    if (status === "SHORTLISTED") return { label: "Mark as hired", target: "HIRED" };
    if (status === "INTERVIEW") return { label: "Mark as hired", target: "HIRED" };
    return null;
}

function NextStepsMenu({
    currentStatus,
    busy,
    messaging,
    onSchedule,
    onStartChat,
    onAdvanceStatus,
}: {
    currentStatus: ApplicationStatus;
    busy: boolean;
    messaging: boolean;
    onSchedule: () => void;
    onStartChat: () => void;
    onAdvanceStatus: (next: DecidedStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // anchor the floating menu to the trigger using fixed positioning so the
    // applicants list's overflow:hidden doesn't clip it
    useLayoutEffect(() => {
        if (!open) return;
        const r = triggerRef.current?.getBoundingClientRect();
        if (!r) return;
        setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }, [open]);

    // close on outside-click and on Escape
    useEffect(() => {
        if (!open) return;
        function onClick(e: MouseEvent) {
            const t = e.target as Node | null;
            if (!t) return;
            if (triggerRef.current?.contains(t)) return;
            if (menuRef.current?.contains(t)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        function onScroll() {
            setOpen(false);
        }
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onScroll);
        };
    }, [open]);

    const advance = nextStepFor(currentStatus);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={busy}
                aria-haspopup="menu"
                aria-expanded={open}
                className={cn(
                    "inline-flex items-center gap-1 h-8 px-3 rounded-md text-[12px] font-medium text-white",
                    "bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/20",
                    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                )}
            >
                Next Steps
                {open ? (
                    <ChevronUp className="h-3 w-3" />
                ) : (
                    <ChevronDown className="h-3 w-3" />
                )}
            </button>

            {open && mounted && pos &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{ top: pos.top, right: pos.right }}
                        className={cn(
                            "fixed z-50 w-56 rounded-md border border-border bg-white shadow-lg",
                            "py-1 text-[12.5px]",
                        )}
                    >
                        <MenuItem
                            icon={<CalendarClock className="h-3.5 w-3.5" />}
                            label="Schedule an interview"
                            onClick={() => {
                                setOpen(false);
                                onSchedule();
                            }}
                        />
                        <MenuItem
                            icon={<MessageSquare className="h-3.5 w-3.5" />}
                            label={messaging ? "Opening chat…" : "Start a chat"}
                            disabled={messaging}
                            onClick={() => {
                                setOpen(false);
                                onStartChat();
                            }}
                        />
                        {advance && (
                            <MenuItem
                                icon={
                                    advance.target === "HIRED" ? (
                                        <Trophy className="h-3.5 w-3.5" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" />
                                    )
                                }
                                label={advance.label}
                                tone={
                                    advance.target === "HIRED"
                                        ? "success"
                                        : "primary"
                                }
                                onClick={() => {
                                    setOpen(false);
                                    onAdvanceStatus(advance.target);
                                }}
                            />
                        )}
                    </div>,
                    document.body,
                )}
        </>
    );
}

function MenuItem({
    icon,
    label,
    tone = "default",
    disabled,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    tone?: "default" | "primary" | "success";
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left",
                "hover:bg-secondary transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                tone === "primary" && "text-orange-700",
                tone === "success" && "text-emerald-700",
            )}
        >
            <span
                className={cn(
                    "shrink-0",
                    tone === "primary"
                        ? "text-orange-600"
                        : tone === "success"
                          ? "text-emerald-600"
                          : "text-muted-foreground",
                )}
            >
                {icon}
            </span>
            {label}
        </button>
    );
}
