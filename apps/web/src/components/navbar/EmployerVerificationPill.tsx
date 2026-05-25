"use client";

import Link from "next/link";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMeStore } from "@/src/store/useMeStore";
import type { CompanyVerificationStatus } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

/**
 * Rounded pill in the navbar that surfaces the employer's company-verification
 * state at a glance. Mirrors the visual language of ProfileCompletionPill
 * (the student-side nudge). Hidden for students; the student pill handles them.
 *
 *   PENDING  — amber, click → dashboard ("we'll review soon")
 *   REJECTED — red,   click → /home/employer/setup (edit & resubmit)
 *   APPROVED — emerald check, no link
 */
export function EmployerVerificationPill() {
    const me = useMeStore((s) => s.me);
    const { memberships, loading } = useMyEmployer();

    const isEmployer = !!me && me.roleConfirmed && me.role === "EMPLOYER";
    if (!isEmployer || loading) return null;

    const company = memberships[0]?.company;
    if (!company) return null;

    return <Pill status={company.verificationStatus} />;
}

function Pill({ status }: { status: CompanyVerificationStatus }) {
    const cfg = STATUS_CONFIG[status];

    const className = cn(
        "inline-flex items-center gap-1.5",
        "h-8 px-3 rounded-full",
        "text-[12px] font-medium",
        "transition-colors",
        cfg.classes,
    );

    const content = (
        <>
            <cfg.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{cfg.label}</span>
            <span className="sm:hidden">{cfg.shortLabel}</span>
        </>
    );

    if (cfg.href) {
        return (
            <Link
                href={cfg.href}
                aria-label={cfg.aria}
                className={cn(className, "cursor-pointer")}
            >
                {content}
            </Link>
        );
    }

    return (
        <span
            aria-label={cfg.aria}
            className={cn(className, "cursor-default")}
        >
            {content}
        </span>
    );
}

const STATUS_CONFIG: Record<
    CompanyVerificationStatus,
    {
        Icon: typeof Check;
        label: string;
        shortLabel: string;
        aria: string;
        href: string | null;
        classes: string;
    }
> = {
    PENDING: {
        Icon: Clock,
        label: "Pending approval",
        shortLabel: "Pending",
        aria: "Your company is pending admin approval",
        href: "/home/dashboard",
        classes:
            "bg-amber-100 text-amber-900 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300",
    },
    APPROVED: {
        Icon: Check,
        label: "Approved",
        shortLabel: "Approved",
        aria: "Your company is verified",
        href: null,
        classes: "bg-emerald-100 text-emerald-800",
    },
    REJECTED: {
        Icon: AlertTriangle,
        label: "Needs update",
        shortLabel: "Update",
        aria: "Admin requested changes — click to edit and resubmit",
        href: "/home/employer/setup",
        classes:
            "bg-red-100 text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300",
    },
};
