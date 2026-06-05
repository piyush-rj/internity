"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminCoupon } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
export default function AdminCouponsPage() {
    const [items, setItems] = useState<AdminCoupon[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_coupons({ pageSize: 100 });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load coupons.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function handleRevoke(id: string) {
        setRevoking(id);
        try {
            await adminApi.revoke_coupon(id);
            await load();
        } catch (err) {
            alert(
                err instanceof ApiClientError ? err.message : "Failed to revoke.",
            );
        } finally {
            setRevoking(null);
        }
    }

    return (
        <section className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Coupons
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Create discount codes for subscription plans. Codes are
                    uppercase alphanumeric and single-use per user.
                </p>
            </header>

            <CreateCouponForm onCreated={load} />

            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
                    <span className="text-[12.5px] font-medium">
                        All coupons
                    </span>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {loading
                            ? "…"
                            : `${total} ${total === 1 ? "coupon" : "coupons"}`}
                    </span>
                </header>

                {error ? (
                    <div className="mx-4 sm:mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                        {error}
                    </div>
                ) : loading && items.length === 0 ? (
                    <Skeleton />
                ) : items.length === 0 ? (
                    <div className="px-5 py-16 text-center text-[12.5px] text-muted-foreground">
                        No coupons yet. Create one above.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {items.map((c) => (
                            <CouponRow
                                key={c.id}
                                coupon={c}
                                revoking={revoking === c.id}
                                onRevoke={() => handleRevoke(c.id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}

/* ──────────────────── Create form ──────────────────── */

function CreateCouponForm({ onCreated }: { onCreated: () => void }) {
    const [code, setCode] = useState("");
    const [defaultPct, setDefaultPct] = useState("");
    const [perPost, setPerPost] = useState("");
    const [monthly, setMonthly] = useState("");
    const [yearly, setYearly] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    function onDefaultChange(val: string) {
        setDefaultPct(val);
        if (!expanded) {
            setPerPost(val);
            setMonthly(val);
            setYearly(val);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        const d = parseInt(defaultPct, 10);
        if (!code.trim() || isNaN(d)) return;
        setSaving(true);
        try {
            await adminApi.create_coupon({
                code: code.trim().toUpperCase(),
                defaultDiscountPct: d,
                discountPctPerPost: perPost ? parseInt(perPost, 10) : undefined,
                discountPctMonthly: monthly ? parseInt(monthly, 10) : undefined,
                discountPctYearly: yearly ? parseInt(yearly, 10) : undefined,
                expiresAt: expiresAt
                    ? new Date(expiresAt).toISOString()
                    : undefined,
            });
            setCode("");
            setDefaultPct("");
            setPerPost("");
            setMonthly("");
            setYearly("");
            setExpiresAt("");
            setExpanded(false);
            onCreated();
        } catch (e) {
            setErr(
                e instanceof ApiClientError
                    ? e.message
                    : "Failed to create coupon.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4"
        >
            <h2 className="text-[13.5px] font-semibold">Create coupon</h2>

            {/* Main fields: 1 col on mobile, 2 on sm, 3 on md */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-[11.5px] font-medium text-muted-foreground">
                        Code <span className="text-destructive">*</span>
                    </label>
                    <input
                        value={code}
                        onChange={(e) =>
                            setCode(
                                e.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, ""),
                            )
                        }
                        placeholder="SUMMER20"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-medium text-muted-foreground">
                        Default discount %{" "}
                        <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={99}
                        value={defaultPct}
                        onChange={(e) => onDefaultChange(e.target.value)}
                        placeholder="20"
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                    />
                </div>
                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[11.5px] font-medium text-muted-foreground">
                        Expires at
                    </label>
                    <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Per-plan overrides */}
            <div>
                <button
                    type="button"
                    onClick={() => setExpanded((p) => !p)}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded ? "▾" : "▸"} Override per-plan discounts
                </button>

                {expanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        {[
                            { label: "Per Post %", val: perPost, set: setPerPost },
                            { label: "Monthly %", val: monthly, set: setMonthly },
                            { label: "Yearly %", val: yearly, set: setYearly },
                        ].map(({ label, val, set }) => (
                            <div key={label} className="space-y-1">
                                <label className="text-[11.5px] font-medium text-muted-foreground">
                                    {label}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={val}
                                    onChange={(e) => set(e.target.value)}
                                    placeholder={defaultPct || "—"}
                                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {err && <p className="text-[12px] text-destructive">{err}</p>}

            <button
                type="submit"
                disabled={saving}
                className="h-9 w-full sm:w-auto px-5 rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                {saving ? "Creating…" : "Create coupon"}
            </button>
        </form>
    );
}

/* ──────────────────── Coupon row ──────────────────── */

function CouponRow({
    coupon: c,
    revoking,
    onRevoke,
}: {
    coupon: AdminCoupon;
    revoking: boolean;
    onRevoke: () => void;
}) {
    const creator = c.createdBy.name ?? c.createdBy.email ?? "Unknown";

    return (
        <div className="px-4 sm:px-5 py-4 space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[14px] font-semibold tracking-wider">
                            {c.code}
                        </span>
                        <StatusPill coupon={c} />
                    </div>
                    <p className="text-[11.5px] text-muted-foreground">
                        Created by {creator} ·{" "}
                        {formatDateShort(c.createdAt)}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                        {c.redemptionCount} used
                    </span>
                    {c.isActive && !c.isExpired && (
                        <button
                            type="button"
                            disabled={revoking}
                            onClick={onRevoke}
                            className="h-8 px-3 rounded-md border border-rose-200 bg-rose-50 text-rose-600 text-[12px] font-medium hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                            {revoking ? "Revoking…" : "Revoke"}
                        </button>
                    )}
                </div>
            </div>

            {/* Discount chips: always 3 cols but compact */}
            <div className="grid grid-cols-3 gap-2">
                <DiscountChip label="Per Post" pct={c.discountPctPerPost} />
                <DiscountChip label="Monthly" pct={c.discountPctMonthly} />
                <DiscountChip label="Yearly" pct={c.discountPctYearly} />
            </div>

            {/* Date range */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[11px] text-muted-foreground">
                <span>Valid {formatDateShort(c.createdAt)}</span>
                <span className="hidden sm:inline">→</span>
                <span>{formatDateShort(c.expiresAt)}</span>
                {c.revokedAt && (
                    <span className="text-rose-500">
                        · Revoked {formatDateShort(c.revokedAt)}
                    </span>
                )}
            </div>
        </div>
    );
}

function DiscountChip({ label, pct }: { label: string; pct: number }) {
    return (
        <div className="rounded-md border border-border bg-secondary/20 px-2 sm:px-2.5 py-1.5 text-center">
            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground">
                {label}
            </p>
            <p className="text-[12px] sm:text-[13px] font-semibold text-orange-600">
                {pct}% off
            </p>
        </div>
    );
}

function StatusPill({ coupon: c }: { coupon: AdminCoupon }) {
    if (!c.isActive) {
        return (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10.5px] font-medium text-rose-600 shrink-0">
                Revoked
            </span>
        );
    }
    if (c.isExpired) {
        return (
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground shrink-0">
                Expired
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
        </span>
    );
}

function Skeleton() {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="px-4 sm:px-5 py-4 space-y-2 animate-pulse"
                >
                    <div className="h-4 w-28 rounded bg-secondary" />
                    <div className="h-3 w-44 rounded bg-secondary" />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {[0, 1, 2].map((j) => (
                            <div key={j} className="h-10 rounded-md bg-secondary" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
