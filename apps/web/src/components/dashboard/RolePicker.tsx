"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { PiBriefcase, PiGraduationCap } from "react-icons/pi";
import { authApi, type UserRole } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type PickableRole = Exclude<UserRole, "ADMIN">;

export function RolePicker({
    onChosen,
}: {
    onChosen: (role: PickableRole) => Promise<void> | void;
}) {
    const [submitting, setSubmitting] = useState<PickableRole | null>(null);

    async function pick(role: PickableRole) {
        if (submitting) return;
        setSubmitting(role);
        try {
            await authApi.set_role(role);
            await onChosen(role);
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t save your choice. Try again.",
            );
        } finally {
            setSubmitting(null);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose your role"
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center",
                "bg-black/40 backdrop-blur-sm px-4",
            )}
        >
            <div
                className={cn(
                    "w-full max-w-lg rounded-lg bg-card",
                    "border border-border shadow-2xl",
                    "p-6 sm:p-8",
                )}
            >
                <header className="text-center">
                    <h1 className="text-[20px] font-semibold tracking-tight">
                        Welcome to SpiderSkill
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Pick how you’ll use the app. You can change this later
                        from settings.
                    </p>
                </header>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RoleCard
                        role="STUDENT"
                        icon={
                            <PiGraduationCap className="h-5 w-5 text-brand" />
                        }
                        title="I'm a student"
                        description="Browse and apply to internships and jobs."
                        loading={submitting === "STUDENT"}
                        disabled={!!submitting}
                        onClick={() => pick("STUDENT")}
                    />
                    <RoleCard
                        role="EMPLOYER"
                        icon={
                            <PiBriefcase className="h-5 w-5 text-emerald-600" />
                        }
                        title="I'm an employer"
                        description="Post listings and hire interns or full-time staff."
                        loading={submitting === "EMPLOYER"}
                        disabled={!!submitting}
                        onClick={() => pick("EMPLOYER")}
                    />
                </div>
            </div>
        </div>
    );
}

function RoleCard({
    icon,
    title,
    description,
    loading,
    disabled,
    onClick,
}: {
    role: PickableRole;
    icon: React.ReactNode;
    title: string;
    description: string;
    loading: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group text-left rounded-lg border border-border bg-background",
                "px-4 py-4 flex flex-col gap-2",
                "transition-colors hover:bg-secondary/40 hover:border-foreground/20",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-3 focus:ring-foreground/10",
            )}
        >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60">
                {icon}
            </span>
            <span className="text-[14px] font-semibold">{title}</span>
            <span className="text-[12px] text-muted-foreground leading-relaxed">
                {description}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-brand">
                {loading ? (
                    "Saving…"
                ) : (
                    <>
                        Continue
                        <ArrowRight className="h-3.5 w-3.5" />
                    </>
                )}
            </span>
        </button>
    );
}
