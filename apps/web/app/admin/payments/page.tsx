"use client";

import { useCallback, useEffect, useState } from "react";
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
    const [items, setItems] = useState<AdminPaymentRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_payments({
                status: status === "all" ? undefined : status,
                pageSize: 50,
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

    return (
        <section className="px-6 py-6 space-y-4">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Payments
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Founder payments tracked across plans. Read-only —
                    refunds happen in Razorpay dashboard.
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
                    <div className="text-[12.5px] font-medium">All payments</div>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {loading
                            ? "…"
                            : `${total} ${total === 1 ? "payment" : "payments"}`}
                    </span>
                </header>

                {error ? (
                    <ErrorRow message={error} />
                ) : loading && items.length === 0 ? (
                    <Skeleton />
                ) : items.length === 0 ? (
                    <Empty />
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
                                {items.map((p) => (
                                    <PaymentRow key={p.id} payment={p} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}

function PaymentRow({ payment }: { payment: AdminPaymentRow }) {
    const company = payment.user.companyMemberships[0]?.company;
    const founder =
        payment.user.name ?? payment.user.email ?? "(no name)";

    return (
        <tr className="hover:bg-secondary/30 transition-colors">
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

function Empty() {
    return (
        <div className="px-5 py-16 text-center text-[12.5px] text-muted-foreground">
            No payments yet. Once founders start subscribing, they'll show up
            here.
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
    return `${symbol}${amount.toLocaleString("en-IN")}`;
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
