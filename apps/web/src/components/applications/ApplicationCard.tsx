import type { ApplicationStatus, ListingWithCompany } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export type ApplicationCardItem = {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
    // When the status last changed — used to show when a withdrawn
    // application was "deleted" in the Recently Deleted view.
    statusUpdatedAt?: string;
    seenAt: string | null;
    listing: ListingWithCompany;
};

const statusStyles: Record<ApplicationStatus, { wrap: string; dot: string }> = {
    APPLIED: {
        wrap: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
    },
    SHORTLISTED: {
        wrap: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
    INTERVIEW: {
        wrap: "bg-violet-50 text-violet-700 border-violet-200",
        dot: "bg-violet-500",
    },
    HIRED: {
        wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    REJECTED: {
        wrap: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
    },
    WITHDRAWN: {
        wrap: "bg-zinc-50 text-zinc-500 border-zinc-200",
        dot: "bg-zinc-400",
    },
};

const statusLabels: Record<ApplicationStatus, string> = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
    const s = statusStyles[status];
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                s.wrap,
            )}
        >
            {statusLabels[status]}
        </span>
    );
}

// seen-by-company indicator shown next to APPLIED status
export function SeenBadge({
    status,
    seenAt,
}: {
    status: ApplicationStatus;
    seenAt: string | null;
}) {
    if (!seenAt) return null;
    if (status !== "APPLIED") return null;
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                "bg-neutral-100 text-neutral-600 border-neutral-200",
            )}
            title={`Founder viewed your application`}
        >
            Seen
        </span>
    );
}
