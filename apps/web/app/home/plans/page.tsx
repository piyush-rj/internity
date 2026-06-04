"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PiArrowRight,
    PiCalendarBlank,
    PiCheckCircleFill,
    PiClock,
    PiCreditCard,
    PiReceipt,
    PiSparkleFill,
    PiWarningCircle,
    PiXCircleFill,
} from "react-icons/pi";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { paymentApi, type MyPayment, type MyPlansResponse } from "@/src/lib/api/payment";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { cn } from "@/src/lib/utils";

export default function MyPlansPage() {
    const { me } = useMe();
    const [data, setData] = useState<MyPlansResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<MyPayment | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await paymentApi.list_mine();
                if (!cancelled) setData(res);
            } catch (err) {
                if (!cancelled)
                    setError(
                        err instanceof ApiClientError
                            ? err.message
                            : "Couldn't load your plans.",
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <EmptySection
            title="My Plans"
            description="Manage your active plan and view payment history."
        >
            {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12.5px] text-destructive">
                    {error}
                </div>
            ) : loading ? (
                <PageSkeleton />
            ) : (
                <div className="space-y-6">
                    <CurrentPlanCard plan={data!.currentPlan} />
                    <TransactionHistory
                        payments={data!.payments}
                        onSelect={setSelected}
                    />
                </div>
            )}
            {selected && (
                <ReceiptPanel
                    payment={selected}
                    user={{ name: me?.name ?? null, email: me?.email ?? null }}
                    onClose={() => setSelected(null)}
                />
            )}
        </EmptySection>
    );
}

function CurrentPlanCard({ plan }: { plan: MyPlansResponse["currentPlan"] }) {
    if (!plan.isPremium || !plan.isActive) {
        return (
            <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[13.5px] font-semibold">No active plan</p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                            {plan.isPremium && !plan.isActive
                                ? "Your plan has expired. Renew to keep posting listings."
                                : "You haven't purchased a plan yet."}
                        </p>
                    </div>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-orange-500 text-white text-[12.5px] font-medium hover:bg-orange-600 transition-colors shrink-0"
                    >
                        <PiSparkleFill className="h-3.5 w-3.5" />
                        Browse plans
                    </Link>
                </div>
            </section>
        );
    }

    const pct = plan.totalDays
        ? Math.max(0, Math.min(100, Math.round((plan.daysRemaining / plan.totalDays) * 100)))
        : 0;
    const urgent = plan.daysRemaining <= 5;

    return (
        <section className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold">
                            <PiCheckCircleFill className="h-3 w-3" />
                            Active
                        </span>
                        <span className="text-[14px] font-semibold">{plan.name}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                        Started {formatDate(plan.since!)} · Expires {formatDate(plan.until!)}
                    </p>
                </div>
                <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-orange-300 bg-white text-orange-600 text-[12.5px] font-medium hover:bg-orange-50 transition-colors shrink-0 sm:self-start"
                >
                    Renew
                    <PiArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <PiClock className="h-3.5 w-3.5" />
                        Time remaining
                    </span>
                    <span className={cn("font-semibold tabular-nums", urgent ? "text-red-600" : "text-foreground")}>
                        {plan.daysRemaining} {plan.daysRemaining === 1 ? "day" : "days"}
                    </span>
                </div>
                <div className="h-2 w-full rounded-full bg-orange-100 overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all",
                            urgent ? "bg-red-500" : pct > 30 ? "bg-emerald-500" : "bg-amber-500",
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatPill icon={PiCalendarBlank} label="Started" value={formatDate(plan.since!)} />
                <StatPill icon={PiCalendarBlank} label="Expires" value={formatDate(plan.until!)} />
                <StatPill icon={PiCreditCard} label="Plan" value={plan.name ?? "—"} />
            </div>
        </section>
    );
}

function StatPill({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof PiCalendarBlank;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <div className="text-[12.5px] font-medium">{value}</div>
        </div>
    );
}

function TransactionHistory({
    payments,
    onSelect,
}: {
    payments: MyPayment[];
    onSelect: (p: MyPayment) => void;
}) {
    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <PiReceipt className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-[13.5px] font-semibold">Payment history</h2>
                <span className="ml-auto text-[11.5px] text-muted-foreground tabular-nums">
                    {payments.length} {payments.length === 1 ? "transaction" : "transactions"}
                </span>
            </header>

            {payments.length === 0 ? (
                <div className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
                    No payments yet.
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {payments.map((p) => (
                        <TxnRow key={p.id} payment={p} onClick={() => onSelect(p)} />
                    ))}
                </div>
            )}
        </section>
    );
}

function TxnRow({ payment: p, onClick }: { payment: MyPayment; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-secondary/40 transition-colors cursor-pointer"
        >
            <div className="mt-0.5 h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <PiCreditCard className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{p.planName}</span>
                    <StatusBadge status={p.status} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                    <span>Paid on {formatDate(p.createdAt)}</span>
                    {p.validUntil && <span>Valid until {formatDate(p.validUntil)}</span>}
                </div>
                {p.razorpayPaymentId && (
                    <p className="text-[10.5px] text-muted-foreground font-mono truncate max-w-45 sm:max-w-none">
                        {p.razorpayPaymentId}
                    </p>
                )}
            </div>

            <div className="shrink-0 text-right">
                <div className="text-[13px] font-semibold tabular-nums">
                    {p.currency === "INR" ? "₹" : p.currency}{(p.amount / 100).toLocaleString("en-IN")}
                </div>
            </div>
        </button>
    );
}

function ReceiptPanel({
    payment: p,
    user,
    onClose,
}: {
    payment: MyPayment;
    user: { name: string | null; email: string | null };
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    function dismiss() {
        setVisible(false);
        setTimeout(onClose, 250);
    }
    const sym = p.currency === "INR" ? "₹" : p.currency;
    const amount = (p.amount / 100).toLocaleString("en-IN");

    const rows: { label: string; value: string; mono?: boolean }[] = [
        { label: "Name", value: user.name ?? "—" },
        { label: "Email", value: user.email ?? "—" },
        { label: "Plan", value: p.planName },
        { label: "Amount paid", value: `${sym}${amount}` },
        { label: "Currency", value: p.currency },
        { label: "Status", value: p.status },
        { label: "Paid on", value: formatDate(p.createdAt) },
        ...(p.validUntil ? [{ label: "Valid until", value: formatDate(p.validUntil) }] : []),
        ...(p.razorpayPaymentId ? [{ label: "Payment ID", value: p.razorpayPaymentId, mono: true }] : []),
        { label: "Order ID", value: p.razorpayOrderId, mono: true },
    ];

    return createPortal(
        <>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/30 transition-opacity duration-250",
                    visible ? "opacity-100" : "opacity-0",
                )}
                onClick={dismiss}
                aria-hidden
            />
            <div className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col",
                "transition-transform duration-250 ease-out",
                visible ? "translate-x-0" : "translate-x-full",
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <PiReceipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[13.5px] font-semibold">Receipt</span>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Amount hero */}
                <div className="px-5 py-6 border-b border-border text-center bg-secondary/30 shrink-0">
                    <div className="text-[32px] font-bold tabular-nums">
                        {sym}{amount}
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">{p.planName} · {formatDate(p.createdAt)}</div>
                    <div className="mt-2">
                        <StatusBadge status={p.status} />
                    </div>
                </div>

                {/* Detail rows */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                            <span className="text-[12px] text-muted-foreground shrink-0">{row.label}</span>
                            <span className={cn(
                                "text-[12px] text-right break-all",
                                row.mono ? "font-mono text-[11px]" : "font-medium",
                            )}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>,
        document.body,
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "SUCCESS") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                <PiCheckCircleFill className="h-2.5 w-2.5" />
                Paid
            </span>
        );
    }
    if (status === "FAILED") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold">
                <PiXCircleFill className="h-2.5 w-2.5" />
                Failed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold">
            <PiWarningCircle className="h-2.5 w-2.5" />
            {status}
        </span>
    );
}

function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="h-5 w-40 rounded bg-secondary" />
                <div className="h-2 w-full rounded-full bg-secondary" />
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-14 rounded-lg bg-secondary" />
                    ))}
                </div>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <div className="h-4 w-36 rounded bg-secondary" />
                </div>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="px-5 py-4 flex gap-4 border-b border-border last:border-0">
                        <div className="h-8 w-8 rounded-full bg-secondary shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-32 rounded bg-secondary" />
                            <div className="h-3 w-48 rounded bg-secondary" />
                        </div>
                        <div className="h-4 w-16 rounded bg-secondary" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
