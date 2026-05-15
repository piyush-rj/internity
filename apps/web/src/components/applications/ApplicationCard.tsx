import type { ApplicationStatus, ListingWithCompany } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

export type ApplicationCardItem = {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
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
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                s.wrap,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {statusLabels[status]}
        </span>
    );
}
