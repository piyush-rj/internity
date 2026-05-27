"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
    Building2,
    CheckCircle2,
    ExternalLink,
    FileText,
    Trash2,
    User as UserIcon,
    X,
} from "lucide-react";
import {
    reportApi,
    type ReportStatus,
    type ReportTargetType,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type ReportItem = Awaited<
    ReturnType<typeof reportApi.admin_list>
>["items"][number];

type ResolveAction = {
    report: ReportItem;
    decision: "RESOLVED" | "DISMISSED";
};

export default function AdminReportsPage() {
    const [status, setStatus] = useState<ReportStatus | "">("OPEN");
    const [target, setTarget] = useState<ReportTargetType | "">("");
    const [items, setItems] = useState<ReportItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState<ResolveAction | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportApi.admin_list({
                status: status || undefined,
                targetType: target || undefined,
                pageSize: 50,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load reports.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [status, target]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function submitResolution(note: string) {
        if (!pending) return;
        try {
            await reportApi.admin_resolve(pending.report.id, {
                status: pending.decision,
                note: note.trim() || undefined,
            });
            toast.success(`Report ${pending.decision.toLowerCase()}.`);
            setPending(null);
            await load();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't update the report.",
            );
        }
    }

    return (
        <section className="px-6 py-6 space-y-4">
            <header className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[20px] font-semibold tracking-tight">
                        Reports
                    </h1>
                    <p className="text-[12.5px] text-muted-foreground">
                        {loading
                            ? "Loading…"
                            : `${total.toLocaleString("en-IN")} reports`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as ReportStatus | "")
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-[12.5px] cursor-pointer"
                    >
                        <option value="">All statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="DISMISSED">Dismissed</option>
                    </select>
                    <select
                        value={target}
                        onChange={(e) =>
                            setTarget(e.target.value as ReportTargetType | "")
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-[12.5px] cursor-pointer"
                    >
                        <option value="">All targets</option>
                        <option value="LISTING">Listings</option>
                        <option value="STUDENT">Students</option>
                    </select>
                </div>
            </header>

            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                    {error}
                </div>
            )}

            <section className="rounded-lg border border-border bg-card overflow-hidden">
                {items.length === 0 && !loading ? (
                    <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                        No reports.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((r) => (
                            <li key={r.id} className="px-5 py-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-medium border",
                                                    r.status === "OPEN"
                                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                                        : r.status ===
                                                            "RESOLVED"
                                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                          : "border-zinc-200 bg-zinc-100 text-zinc-700",
                                                )}
                                            >
                                                {r.status}
                                            </span>
                                            <span className="text-[12.5px] font-medium">
                                                {r.targetType === "LISTING"
                                                    ? r.targetListing
                                                        ? `Listing: ${r.targetListing.title} (${r.targetListing.company.name})`
                                                        : "Listing (removed)"
                                                    : r.targetStudent
                                                      ? `Student: ${r.targetStudent.name ?? r.targetStudent.email}`
                                                      : "Student (removed)"}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                                            Reported by{" "}
                                            {r.reporter.name ??
                                                r.reporter.email}{" "}
                                            ·{" "}
                                            {new Date(
                                                r.createdAt,
                                            ).toLocaleString("en-IN", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </div>
                                    </div>
                                    {r.status === "OPEN" && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                type="button"
                                                variant="exec-light"
                                                onClick={() =>
                                                    setPending({
                                                        report: r,
                                                        decision: "RESOLVED",
                                                    })
                                                }
                                                className="h-8 px-3 text-[11.5px] cursor-pointer"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Resolve
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="exec-light"
                                                onClick={() =>
                                                    setPending({
                                                        report: r,
                                                        decision: "DISMISSED",
                                                    })
                                                }
                                                className="h-8 px-3 text-[11.5px] cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Dismiss
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[12.5px] text-foreground/90 whitespace-pre-wrap leading-relaxed border-l-2 border-border pl-3">
                                    {r.reason}
                                </p>
                                <TargetActions report={r} />
                                {r.resolutionNote && (
                                    <p className="text-[11.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                                        Resolution:{" "}
                                        {r.resolvedBy?.name && (
                                            <span className="font-medium">
                                                {r.resolvedBy.name}:{" "}
                                            </span>
                                        )}
                                        {r.resolutionNote}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <ResolveReportDialog
                action={pending}
                onCancel={() => setPending(null)}
                onSubmit={submitResolution}
            />
        </section>
    );
}

function TargetActions({ report }: { report: ReportItem }) {
    const links: { href: string; label: string; icon: React.ReactNode }[] = [];

    if (report.targetType === "LISTING" && report.targetListing) {
        links.push({
            href: `/home/listings/${report.targetListing.id}`,
            label: "View listing",
            icon: <FileText className="h-3 w-3" />,
        });
        links.push({
            href: `/company/${report.targetListing.company.slug}`,
            label: `${report.targetListing.company.name} page`,
            icon: <Building2 className="h-3 w-3" />,
        });
        links.push({
            href: `/admin/listings?q=${encodeURIComponent(report.targetListing.company.name)}`,
            label: "All listings",
            icon: <FileText className="h-3 w-3" />,
        });
    } else if (report.targetType === "STUDENT" && report.targetStudent) {
        links.push({
            href: `/student/${report.targetStudent.id}`,
            label: "View student",
            icon: <UserIcon className="h-3 w-3" />,
        });
    }

    if (links.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {links.map((l) => (
                <Link
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "inline-flex items-center gap-1 rounded-md border border-border bg-background",
                        "px-2 py-1 text-[11px] text-foreground/80",
                        "hover:bg-secondary hover:text-foreground transition-colors cursor-pointer",
                    )}
                >
                    {l.icon}
                    <span>{l.label}</span>
                    <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                </Link>
            ))}
        </div>
    );
}

function ResolveReportDialog({
    action,
    onCancel,
    onSubmit,
}: {
    action: ResolveAction | null;
    onCancel: () => void;
    onSubmit: (note: string) => Promise<void>;
}) {
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (action) setNote("");
    }, [action]);

    useEffect(() => {
        if (!action) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !busy) onCancel();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [action, busy, onCancel]);

    if (!action || !mounted) return null;

    const isResolve = action.decision === "RESOLVED";
    const title = isResolve ? "Resolve report" : "Dismiss report";
    const helper = isResolve
        ? "Add an internal note explaining how this was resolved (optional)."
        : "Add an internal note explaining why this was dismissed (optional).";
    const confirmLabel = isResolve ? "Resolve" : "Dismiss";

    async function handleConfirm() {
        if (busy) return;
        setBusy(true);
        try {
            await onSubmit(note);
        } finally {
            setBusy(false);
        }
    }

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-100 bg-black/40"
                onClick={() => !busy && onCancel()}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-md mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col",
                )}
            >
                <header className="flex items-center justify-between px-5 h-12 border-b border-border">
                    <h2 className="text-[14px] font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        aria-label="Close"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </header>

                <div className="px-5 py-4 space-y-3">
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                        {helper}
                    </p>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Talked to the founder, listing taken down."
                        maxLength={500}
                        autoFocus
                        className={cn(
                            "w-full h-24 rounded-md border border-border bg-background px-3 py-2",
                            "text-[12.5px] outline-none resize-none leading-relaxed",
                            "focus:ring-2 focus:ring-orange-300/60 focus:border-orange-300",
                            "placeholder:text-muted-foreground/70",
                        )}
                    />
                    <div className="text-right text-[10.5px] text-muted-foreground tabular-nums">
                        {note.length}/500
                    </div>
                </div>

                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onCancel}
                        disabled={busy}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={handleConfirm}
                        disabled={busy}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        {busy ? "Working…" : confirmLabel}
                    </Button>
                </footer>
            </div>
        </>,
        document.body,
    );
}
