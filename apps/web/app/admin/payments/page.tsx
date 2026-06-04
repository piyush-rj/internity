"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Receipt, Search, X } from "lucide-react";
import {
    PiCheckCircleFill,
    PiWarningCircle,
    PiXCircleFill,
} from "react-icons/pi";
import { adminApi, type AdminPaymentRow } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type StatusFilter = "all" | "CREATED" | "SUCCESS" | "FAILED";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "SUCCESS", label: "Successful" },
    { key: "CREATED", label: "Pending" },
    { key: "FAILED", label: "Failed" },
];

export default function AdminPaymentsPage() {
    const [status, setStatus] = useState<StatusFilter>("all");
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<AdminPaymentRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<AdminPaymentRow | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_payments({
                status: status === "all" ? undefined : status,
                pageSize: 500,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load payments.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((p) => {
            const company =
                p.user.companyMemberships[0]?.company.name ?? "";
            const date = formatDate(p.createdAt).toLowerCase();
            return (
                (p.user.name ?? "").toLowerCase().includes(q) ||
                (p.user.email ?? "").toLowerCase().includes(q) ||
                company.toLowerCase().includes(q) ||
                p.planCode.toLowerCase().includes(q) ||
                p.razorpayOrderId.toLowerCase().includes(q) ||
                (p.razorpayPaymentId ?? "").toLowerCase().includes(q) ||
                date.includes(q) ||
                formatAmount(p.amount, p.currency).toLowerCase().includes(q)
            );
        });
    }, [items, query]);

    return (
        <section className="px-6 py-6 space-y-4">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Payments
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Founder payments tracked across plans. Read-only — refunds
                    happen in Razorpay dashboard.
                </p>
            </header>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shadow-xs w-fit">
                    {STATUS_TABS.map((t) => {
                        const active = t.key === status;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => {
                                    setStatus(t.key);
                                    setQuery("");
                                }}
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

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Name, email, company, TXN…"
                        className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-8 text-[12.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div className="text-[12.5px] font-medium">
                        All payments
                    </div>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {loading
                            ? "…"
                            : query
                              ? `${filteredItems.length} of ${total} ${total === 1 ? "payment" : "payments"}`
                              : `${total} ${total === 1 ? "payment" : "payments"}`}
                    </span>
                </header>

                {error ? (
                    <ErrorRow message={error} />
                ) : loading && items.length === 0 ? (
                    <Skeleton />
                ) : filteredItems.length === 0 ? (
                    <Empty hasQuery={!!query} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead className="border-b border-border bg-neutral-50">
                                <tr className="text-left text-muted-foreground">
                                    <Th>Founder</Th>
                                    <Th>Company</Th>
                                    <Th>Plan</Th>
                                    <Th align="right">Amount</Th>
                                    <Th>Status</Th>
                                    <Th>Date</Th>
                                    <Th>Razorpay order</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredItems.map((p) => (
                                    <PaymentRow
                                        key={p.id}
                                        payment={p}
                                        onClick={() => setSelected(p)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selected && (
                <ReceiptPanel
                    payment={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </section>
    );
}

function PaymentRow({
    payment,
    onClick,
}: {
    payment: AdminPaymentRow;
    onClick: () => void;
}) {
    const company = payment.user.companyMemberships[0]?.company;
    const founder = payment.user.name ?? payment.user.email ?? "(no name)";

    return (
        <tr
            onClick={onClick}
            className="hover:bg-secondary/30 transition-colors cursor-pointer"
        >
            <Td>
                <div className="font-medium truncate max-w-50">{founder}</div>
                {payment.user.email && (
                    <div className="text-[11px] text-muted-foreground truncate max-w-50">
                        {payment.user.email}
                    </div>
                )}
            </Td>
            <Td>
                {company ? (
                    <span className="truncate inline-block max-w-44">
                        {company.name}
                    </span>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </Td>
            <Td>
                <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                    {prettyPlan(payment.planCode)}
                </span>
            </Td>
            <Td align="right">
                <span className="tabular-nums font-medium">
                    {formatAmount(payment.amount, payment.currency)}
                </span>
            </Td>
            <Td>
                <StatusPill status={payment.status} />
            </Td>
            <Td>
                <span className="tabular-nums text-foreground/80">
                    {formatDate(payment.createdAt)}
                </span>
            </Td>
            <Td>
                <span className="font-mono text-[11px] text-muted-foreground truncate inline-block max-w-40">
                    {payment.razorpayOrderId}
                </span>
            </Td>
        </tr>
    );
}

function ReceiptPanel({
    payment: p,
    onClose,
}: {
    payment: AdminPaymentRow;
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

    const company = p.user.companyMemberships[0]?.company.name ?? "—";
    const sym = p.currency === "INR" ? "₹" : p.currency + " ";
    const amountFormatted = formatAmount(p.amount, p.currency);

    const rows: { label: string; value: string; mono?: boolean }[] = [
        { label: "Name", value: p.user.name ?? "—" },
        { label: "Email", value: p.user.email ?? "—" },
        { label: "Company", value: company },
        { label: "Plan", value: prettyPlan(p.planCode) },
        { label: "Amount paid", value: amountFormatted },
        { label: "Currency", value: p.currency },
        { label: "Status", value: p.status },
        { label: "Date", value: formatDate(p.createdAt) },
        { label: "Order ID", value: p.razorpayOrderId, mono: true },
        ...(p.razorpayPaymentId
            ? [
                  {
                      label: "Payment ID",
                      value: p.razorpayPaymentId,
                      mono: true,
                  },
              ]
            : []),
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
            <div
                className={cn(
                    "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col",
                    "transition-transform duration-250 ease-out",
                    visible ? "translate-x-0" : "translate-x-full",
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[13.5px] font-semibold">
                            Receipt
                        </span>
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
                        {sym}
                        {(p.amount / 100).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">
                        {prettyPlan(p.planCode)} · {formatDate(p.createdAt)}
                    </div>
                    <div className="mt-2">
                        <StatusBadge status={p.status} />
                    </div>
                </div>

                {/* Detail rows */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0"
                        >
                            <span className="text-[12px] text-muted-foreground shrink-0">
                                {row.label}
                            </span>
                            <span
                                className={cn(
                                    "text-[12px] text-right break-all",
                                    row.mono
                                        ? "font-mono text-[11px]"
                                        : "font-medium",
                                )}
                            >
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

function StatusPill({ status }: { status: AdminPaymentRow["status"] }) {
    const styles: Record<AdminPaymentRow["status"], string> = {
        CREATED: "bg-amber-50 text-amber-800 border-amber-200",
        SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
        FAILED: "bg-rose-50 text-rose-700 border-rose-200",
    };
    const labels: Record<AdminPaymentRow["status"], string> = {
        CREATED: "Pending",
        SUCCESS: "Paid",
        FAILED: "Failed",
    };
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
                styles[status],
            )}
        >
            {labels[status]}
        </span>
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

function Th({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right";
}) {
    return (
        <th
            className={cn(
                "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider",
                align === "right" && "text-right",
            )}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "right";
}) {
    return (
        <td
            className={cn(
                "px-4 py-3 align-top",
                align === "right" && "text-right",
            )}
        >
            {children}
        </td>
    );
}

function Empty({ hasQuery }: { hasQuery: boolean }) {
    return (
        <div className="px-5 py-16 text-center text-[12.5px] text-muted-foreground">
            {hasQuery
                ? "No payments match that search."
                : "No payments yet. Once founders start subscribing, they'll show up here."}
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            {message}
        </div>
    );
}

function Skeleton() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-center gap-3 px-5 py-3.5 animate-pulse"
                >
                    <div className="h-3 w-1/4 rounded-full bg-secondary" />
                    <div className="h-3 w-1/6 rounded-full bg-secondary" />
                    <div className="h-3 w-1/12 rounded-full bg-secondary" />
                    <div className="ml-auto h-3 w-16 rounded-full bg-secondary" />
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------- helpers --------------------------------- */

function prettyPlan(code: string): string {
    if (code === "PER_POST") return "Per Post";
    if (code === "MONTHLY") return "Monthly";
    if (code === "YEARLY") return "Yearly";
    if (code === "PRO") return "Pro";
    return code;
}

function formatAmount(amount: number, currency: string): string {
    const symbol = currency === "INR" ? "₹" : currency + " ";
    return `${symbol}${(amount / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
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
