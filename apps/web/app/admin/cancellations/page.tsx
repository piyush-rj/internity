"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminCancellationRequest } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
];

const REASON_LABELS: Record<string, string> = {
    TOO_EXPENSIVE: "Too expensive",
    LOW_APPLICANT_QUALITY: "Low applicant quality",
    ALREADY_HIRED: "Already hired",
    FOUND_BETTER_PLATFORM: "Found better platform",
    TECHNICAL_ISSUES: "Technical issues",
    OTHER: "Other",
};

export default function AdminCancellationsPage() {
    const [status, setStatus] = useState<StatusFilter>("all");
    const [items, setItems] = useState<AdminCancellationRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_cancellation_requests({
                status: status === "all" ? undefined : status,
                pageSize: 100,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load requests.",
            );
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function handleAction(
        id: string,
        action: "approve" | "reject",
    ) {
        setActionLoading(id + action);
        try {
            await adminApi.update_cancellation_request(id, { action });
            await load();
        } catch (err) {
            alert(
                err instanceof ApiClientError
                    ? err.message
                    : "Action failed.",
            );
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <section className="px-6 py-6 space-y-4">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Cancellation Requests
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Subscription cancellation and refund requests from founders.
                    Approve to revoke premium access immediately.
                </p>
            </header>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shadow-xs w-fit">
                {STATUS_TABS.map((t) => {
                    const active = t.key === status;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setStatus(t.key)}
                            className={cn(
                                "inline-flex items-center h-7 px-3 rounded-md text-[12px] font-medium cursor-pointer transition-colors",
                                active
                                    ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div className="text-[12.5px] font-medium">
                        Cancellation requests
                    </div>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {loading ? "…" : `${total} ${total === 1 ? "request" : "requests"}`}
                    </span>
                </header>

                {error ? (
                    <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                        {error}
                    </div>
                ) : loading && items.length === 0 ? (
                    <Skeleton />
                ) : items.length === 0 ? (
                    <Empty />
                ) : (
                    <div className="divide-y divide-border">
                        {items.map((r) => (
                            <RequestRow
                                key={r.id}
                                request={r}
                                actionLoading={actionLoading}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}

function RequestRow({
    request: r,
    actionLoading,
    onAction,
}: {
    request: AdminCancellationRequest;
    actionLoading: string | null;
    onAction: (id: string, action: "approve" | "reject") => void;
}) {
    const company = r.user.companyMemberships[0]?.company;
    const founder = r.user.name ?? r.user.email ?? "(no name)";
    const isPending = r.status === "PENDING";

    return (
        <div className="px-5 py-4 space-y-3">
            {/* Row header: user + plan + status */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold truncate">
                            {founder}
                        </span>
                        <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11.5px] text-muted-foreground">
                        {r.user.email && <span>{r.user.email}</span>}
                        {company && <span>· {company.name}</span>}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold tabular-nums">
                        {r.payment.currency === "INR" ? "₹" : r.payment.currency}
                        {(r.payment.amount / 100).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                        {r.payment.planName}
                    </p>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Detail label="Reason" value={REASON_LABELS[r.reason] ?? r.reason} />
                <Detail
                    label="Listings used"
                    value={
                        r.listingsUsedAtRequest === 0
                            ? "None"
                            : String(r.listingsUsedAtRequest)
                    }
                    valueClass={
                        r.listingsUsedAtRequest > 0
                            ? "text-amber-600"
                            : "text-emerald-600"
                    }
                />
                <Detail
                    label="Requested"
                    value={formatDate(r.createdAt)}
                />
                <Detail
                    label="Payment date"
                    value={formatDate(r.payment.createdAt)}
                />
            </div>

            {/* Other text if present */}
            {r.otherText && (
                <p className="text-[12px] text-muted-foreground bg-secondary/40 rounded-md px-3 py-2 italic">
                    &ldquo;{r.otherText}&rdquo;
                </p>
            )}

            {/* Admin note if resolved */}
            {r.adminNote && (
                <p className="text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">Admin note:</span>{" "}
                    {r.adminNote}
                </p>
            )}

            {/* Actions for pending requests */}
            {isPending && (
                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => onAction(r.id, "approve")}
                        className="h-8 px-4 rounded-md bg-emerald-500 text-white text-[12px] font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === r.id + "approve"
                            ? "Approving…"
                            : "Approve & revoke premium"}
                    </button>
                    <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => onAction(r.id, "reject")}
                        className="h-8 px-4 rounded-md border border-border bg-background text-[12px] font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        {actionLoading === r.id + "reject"
                            ? "Rejecting…"
                            : "Reject"}
                    </button>
                </div>
            )}

            {r.resolvedAt && (
                <p className="text-[11px] text-muted-foreground">
                    Resolved {formatDate(r.resolvedAt)}
                </p>
            )}
        </div>
    );
}

function Detail({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="rounded-md border border-border bg-secondary/20 px-2.5 py-2">
            <p className="text-[10.5px] text-muted-foreground">{label}</p>
            <p className={cn("text-[12px] font-medium mt-0.5", valueClass)}>
                {value}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
        APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
    };
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                styles[status] ?? "bg-secondary text-foreground border-border",
            )}
        >
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}

function Empty() {
    return (
        <div className="px-5 py-16 text-center text-[12.5px] text-muted-foreground">
            No cancellation requests yet.
        </div>
    );
}

function Skeleton() {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 space-y-2 animate-pulse">
                    <div className="h-3.5 w-48 rounded bg-secondary" />
                    <div className="h-3 w-32 rounded bg-secondary" />
                    <div className="grid grid-cols-4 gap-3 mt-2">
                        {[0, 1, 2, 3].map((j) => (
                            <div key={j} className="h-10 rounded-md bg-secondary" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
