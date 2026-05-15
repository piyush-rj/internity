"use client";

import type { ComponentType, ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
    PiBriefcase,
    PiBriefcaseFill,
    PiFolder,
    PiFolderFill,
    PiGraduationCap,
    PiGraduationCapFill,
    PiIdentificationCard,
    PiIdentificationCardFill,
    PiSealCheck,
    PiSealCheckFill,
    PiGlobeHemisphereWest,
    PiGlobeHemisphereWestFill,
    PiSparkle,
    PiSparkleFill,
    PiUser,
    PiUserFill,
} from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import type { StudentProfile } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export type StepKey =
    | "summary"
    | "basics"
    | "education"
    | "experience"
    | "projects"
    | "skills"
    | "certifications"
    | "languages";

type IconComp = ComponentType<{ className?: string }>;

export type StepConfig = {
    key: StepKey;
    label: string;
    icon: IconComp;
    iconFilled: IconComp;
};

export const stepsConfig: StepConfig[] = [
    {
        key: "summary",
        label: "Summary",
        icon: PiIdentificationCard,
        iconFilled: PiIdentificationCardFill,
    },
    { key: "basics", label: "Basics", icon: PiUser, iconFilled: PiUserFill },
    {
        key: "education",
        label: "Education",
        icon: PiGraduationCap,
        iconFilled: PiGraduationCapFill,
    },
    {
        key: "experience",
        label: "Experience",
        icon: PiBriefcase,
        iconFilled: PiBriefcaseFill,
    },
    {
        key: "projects",
        label: "Projects",
        icon: PiFolder,
        iconFilled: PiFolderFill,
    },
    {
        key: "skills",
        label: "Skills",
        icon: PiSparkle,
        iconFilled: PiSparkleFill,
    },
    {
        key: "certifications",
        label: "Certifications",
        icon: PiSealCheck,
        iconFilled: PiSealCheckFill,
    },
    {
        key: "languages",
        label: "Languages",
        icon: PiGlobeHemisphereWest,
        iconFilled: PiGlobeHemisphereWestFill,
    },
];

const editableSteps: StepKey[] = stepsConfig
    .filter((s) => s.key !== "summary")
    .map((s) => s.key);

export function nextStep(current: StepKey): StepKey | null {
    const i = editableSteps.indexOf(current);
    return i < 0 || i === editableSteps.length - 1
        ? null
        : editableSteps[i + 1]!;
}

export function prevStep(current: StepKey): StepKey | null {
    const i = editableSteps.indexOf(current);
    return i <= 0 ? null : editableSteps[i - 1]!;
}

export function computeCompletion(profile: StudentProfile | null) {
    const done: Record<StepKey, boolean> = {
        summary: false,
        basics: Boolean(profile?.firstName),
        education: (profile?.educations.length ?? 0) > 0,
        experience: (profile?.experiences.length ?? 0) > 0,
        projects: (profile?.projects.length ?? 0) > 0,
        skills: (profile?.skills.length ?? 0) > 0,
        certifications: (profile?.certifications.length ?? 0) > 0,
        languages: (profile?.languages.length ?? 0) > 0,
    };
    const count = editableSteps.filter((k) => done[k]).length;
    const pct = Math.round((count / editableSteps.length) * 100);
    return { done, count, pct };
}

export function inputCls(invalid?: boolean): string {
    return cn(
        "w-full h-10 rounded-lg border bg-background px-3",
        "text-[14px] text-foreground placeholder:text-muted-foreground/70",
        "transition-colors outline-none",
        "focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
        invalid ? "border-destructive/60" : "border-border",
    );
}

export function Field({
    label,
    hint,
    required,
    error,
    icon,
    children,
}: {
    label: string;
    hint?: string;
    required?: boolean;
    error?: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="flex items-center gap-1.5 mb-1.5 text-[12.5px] font-medium text-foreground">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                {label}
                {required && <span className="text-destructive">*</span>}
            </span>
            {children}
            {error ? (
                <span className="mt-1 block text-[11.5px] text-destructive">
                    {error}
                </span>
            ) : hint ? (
                <span className="mt-1 block text-[11.5px] text-muted-foreground">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

export function StepShell({
    stepKey,
    title,
    description,
    children,
    onBack,
    onContinue,
    continueLabel = "Continue",
    saving,
}: {
    stepKey: StepKey;
    title: string;
    description: string;
    children: ReactNode;
    onBack?: () => void;
    onContinue: () => void;
    continueLabel?: string;
    saving?: boolean;
}) {
    const cfg = stepsConfig.find((s) => s.key === stepKey)!;
    const Icon = cfg.icon;
    return (
        <div className="flex flex-col">
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-brand/15 text-brand">
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13px] font-medium text-foreground">
                        {cfg.label}
                    </span>
                </div>
                <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.15]">
                    {title}
                </h1>
                <p className="mt-2 text-[14px] text-muted-foreground max-w-xl leading-relaxed">
                    {description}
                </p>
            </header>

            <div className="flex-1">{children}</div>

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
                {onBack ? (
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onBack}
                        disabled={saving}
                        className="h-10 px-4 text-[13px] cursor-pointer"
                    >
                        Back
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={onContinue}
                    disabled={saving}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving ? "Saving…" : continueLabel}
                </Button>
            </div>
        </div>
    );
}

export function AddButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-center gap-1.5",
                "h-10 rounded-lg border border-dashed border-border bg-background",
                "text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors",
            )}
        >
            <Plus className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Delete"
            className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md shrink-0",
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                "transition-colors",
            )}
        >
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    );
}

export function EntityCard({
    title,
    subtitle,
    meta,
    onDelete,
}: {
    title: string;
    subtitle?: string;
    meta?: string;
    onDelete?: () => void;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 px-4 py-3",
                "rounded-lg border border-border bg-background",
            )}
        >
            <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-foreground truncate">
                    {title}
                </div>
                {subtitle && (
                    <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                        {subtitle}
                    </div>
                )}
                {meta && (
                    <div className="mt-1 text-[11.5px] text-muted-foreground">
                        {meta}
                    </div>
                )}
            </div>
            {onDelete && <DeleteButton onClick={onDelete} />}
        </div>
    );
}

export function InlineFormCard({
    children,
    onCancel,
    onSave,
    saving,
    saveLabel = "Save",
    error,
}: {
    children: ReactNode;
    onCancel: () => void;
    onSave: () => void;
    saving?: boolean;
    saveLabel?: string;
    error?: string | null;
}) {
    return (
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            {children}
            {error && (
                <div className="text-[12px] text-destructive">{error}</div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={onSave}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {saving ? "Saving…" : saveLabel}
                </Button>
            </div>
        </div>
    );
}

export function ProfileMissingNotice() {
    return (
        <div
            className={cn(
                "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3",
                "text-[12.5px] text-amber-800",
            )}
        >
            Fill in your basics first — you can return here right after.
        </div>
    );
}
