"use client";

import {
    PiCake,
    PiEnvelope,
    PiMapPin,
    PiPencilSimple,
    PiPhone,
    PiSealCheck,
    PiUser,
} from "react-icons/pi";
import {
    computeCompletion,
    stepsConfig,
    type StepKey,
} from "@/src/components/profile-wizard/utils";
import type { StudentProfile } from "@/src/lib/api";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ProfileSummaryCard({
    profile,
    onMissingDetailsClick,
}: {
    profile: StudentProfile | null;
    onMissingDetailsClick?: (step: StepKey) => void;
}) {
    const session = useUserSessionStore((s) => s.session);
    const { done, count, pct } = computeCompletion(profile);
    const missingCount = stepsConfig.length - count;
    const firstMissingStep = stepsConfig.find((s) => !done[s.key])?.key;
    const firstMissingLabel = stepsConfig.find((s) => !done[s.key])?.label;

    const firstName = profile?.firstName ?? "";
    const lastName = profile?.lastName ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const initial = (fullName || session?.user?.name || "?")
        .charAt(0)
        .toUpperCase();

    const firstEducation = profile?.educations[0];

    return (
        <section
            className={cn(
                "flex flex-col sm:flex-row items-start gap-5 sm:gap-7",
                "rounded-xl border border-border bg-card p-5 sm:p-6",
            )}
        >
            {/* Avatar + completion ring */}
            <CompletionAvatar
                pct={pct}
                initial={initial}
                imageUrl={session?.user?.image ?? null}
            />

            {/* Identity + facts */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-tight uppercase text-foreground truncate">
                        {fullName || "Your name"}
                    </h2>
                    <PiPencilSimple className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                {firstEducation ? (
                    <>
                        <div className="mt-1 text-[14px] font-medium text-foreground">
                            {firstEducation.degree}
                            {firstEducation.fieldOfStudy
                                ? ` · ${firstEducation.fieldOfStudy}`
                                : ""}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground">
                            {firstEducation.institute}
                        </div>
                    </>
                ) : (
                    <div className="mt-1 text-[13px] text-muted-foreground">
                        Add an education to introduce yourself.
                    </div>
                )}

                <div className="mt-4 h-px bg-border" />

                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-lg">
                    <FactRow icon={<PiMapPin />} value={profile?.city} />
                    <FactRow
                        icon={<PiPhone />}
                        value={profile?.phone}
                        verified
                    />
                    <FactRow
                        icon={<PiUser />}
                        value={genderLabel(profile?.gender)}
                    />
                    <FactRow
                        icon={<PiEnvelope />}
                        value={session?.user?.email}
                        verified
                        truncate
                    />
                    <FactRow
                        icon={<PiCake />}
                        value={formatDob(profile?.dob)}
                    />
                </dl>
            </div>

            {/* Missing details CTA */}
            {missingCount > 0 && firstMissingStep && (
                <MissingDetailsCard
                    label={firstMissingLabel ?? "Add details"}
                    missingCount={missingCount}
                    onClick={() => onMissingDetailsClick?.(firstMissingStep)}
                />
            )}
        </section>
    );
}

function CompletionAvatar({
    pct,
    initial,
    imageUrl,
}: {
    pct: number;
    initial: string;
    imageUrl: string | null;
}) {
    const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="4"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="rgb(16 185 129)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>

            <div className="absolute inset-2 rounded-full overflow-hidden bg-muted ring-1 ring-border flex items-center justify-center">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-[28px] font-semibold text-muted-foreground">
                        {initial}
                    </span>
                )}
            </div>

            <span
                className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2",
                    "inline-flex items-center justify-center",
                    "rounded-full bg-emerald-500 text-white",
                    "px-2 h-5 text-[10.5px] font-semibold tabular-nums",
                    "shadow-sm ring-2 ring-card",
                )}
            >
                {pct}%
            </span>
        </div>
    );
}

function FactRow({
    icon,
    value,
    verified,
    truncate,
}: {
    icon: React.ReactNode;
    value: string | null | undefined;
    verified?: boolean;
    truncate?: boolean;
}) {
    if (!value) {
        return (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground/60">
                <span className="h-3.5 w-3.5 inline-flex items-center justify-center">
                    {icon}
                </span>
                <span className="italic">Not added</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 text-[13px] text-foreground min-w-0">
            <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-muted-foreground shrink-0">
                {icon}
            </span>
            <span className={cn(truncate && "truncate")}>{value}</span>
            {verified && (
                <PiSealCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
        </div>
    );
}

function MissingDetailsCard({
    label,
    missingCount,
    onClick,
}: {
    label: string;
    missingCount: number;
    onClick: () => void;
}) {
    return (
        <div
            className={cn(
                "shrink-0 w-full sm:w-64 self-stretch flex flex-col justify-between",
                "rounded-xl border border-amber-200 bg-amber-50",
                "p-4",
            )}
        >
            <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-md bg-white border border-amber-200 flex items-center justify-center">
                    <PiPencilSimple className="h-4 w-4 text-amber-700" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">
                        Add {label.toLowerCase()}
                    </div>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium tabular-nums">
                    ↑ {Math.round(100 / 7)}%
                </span>
            </div>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "mt-4 w-full rounded-full bg-orange-500 hover:bg-orange-600",
                    "text-white text-[13px] font-medium",
                    "h-9 px-4 transition-colors",
                )}
            >
                Add {missingCount} missing detail{missingCount === 1 ? "" : "s"}
            </button>
        </div>
    );
}

function genderLabel(g: StudentProfile["gender"] | undefined): string | null {
    switch (g) {
        case "MALE":
            return "Male";
        case "FEMALE":
            return "Female";
        case "OTHER":
            return "Other";
        case "PREFER_NOT_TO_SAY":
            return "Prefer not to say";
        default:
            return null;
    }
}

function formatDob(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
