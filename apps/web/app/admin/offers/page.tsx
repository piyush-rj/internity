"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Tag, X, Zap } from "lucide-react";
import { adminApi, type AdminCoupon, type AdminOffer } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type Tab = "offers" | "coupons";

export default function AdminOffersPage() {
    const [tab, setTab] = useState<Tab>("offers");
    const [query, setQuery] = useState("");

    const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
    const [offers, setOffers] = useState<AdminOffer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);

    const [selectedCoupon, setSelectedCoupon] = useState<AdminCoupon | null>(null);
    const [selectedOffer, setSelectedOffer] = useState<AdminOffer | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [c, o] = await Promise.all([
                adminApi.list_coupons({ pageSize: 100 }),
                adminApi.list_offers({ pageSize: 100 }),
            ]);
            setCoupons(c.items);
            setOffers(o.items);
        } catch (err) {
            setError(
                err instanceof ApiClientError ? err.message : "Couldn't load data.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAll();
    }, [loadAll]);

    async function handleRevokeCoupon(id: string) {
        setRevoking(id);
        try {
            await adminApi.revoke_coupon(id);
            setSelectedCoupon(null);
            await loadAll();
        } catch (err) {
            alert(err instanceof ApiClientError ? err.message : "Failed to revoke.");
        } finally {
            setRevoking(null);
        }
    }

    async function handleRevokeOffer(id: string) {
        setRevoking(id);
        try {
            await adminApi.revoke_offer(id);
            setSelectedOffer(null);
            await loadAll();
        } catch (err) {
            alert(err instanceof ApiClientError ? err.message : "Failed to revoke.");
        } finally {
            setRevoking(null);
        }
    }

    const q = query.trim().toLowerCase();

    const filteredCoupons = useMemo(
        () =>
            q
                ? coupons.filter(
                      (c) =>
                          c.code.toLowerCase().includes(q) ||
                          (c.createdBy.name ?? "").toLowerCase().includes(q) ||
                          (c.createdBy.email ?? "").toLowerCase().includes(q),
                  )
                : coupons,
        [coupons, q],
    );

    const filteredOffers = useMemo(
        () =>
            q
                ? offers.filter(
                      (o) =>
                          o.title.toLowerCase().includes(q) ||
                          (o.description ?? "").toLowerCase().includes(q) ||
                          (o.createdBy.name ?? "").toLowerCase().includes(q) ||
                          (o.createdBy.email ?? "").toLowerCase().includes(q),
                  )
                : offers,
        [offers, q],
    );

    return (
        <section className="px-3 sm:px-6 py-4 sm:py-6 space-y-5">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Offers & Coupons
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Create and manage promotional offers and discount coupon codes.
                </p>
            </header>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shadow-xs w-fit">
                {(["offers", "coupons"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => { setTab(t); setQuery(""); }}
                        className={cn(
                            "inline-flex items-center h-7 px-3 rounded-md text-[12px] font-medium cursor-pointer transition-colors capitalize",
                            tab === t
                                ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "offers" ? (
                <CreateOfferForm onCreated={loadAll} />
            ) : (
                <CreateCouponForm onCreated={loadAll} />
            )}

            {/* History list */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border">
                    <span className="text-[12.5px] font-medium capitalize">
                        {tab} history
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={tab === "coupons" ? "Code, creator…" : "Title, creator…"}
                                className="h-8 w-44 sm:w-52 rounded-lg border border-border bg-background pl-8 pr-7 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <span className="text-[11.5px] text-muted-foreground tabular-nums shrink-0">
                            {loading ? "…" : tab === "coupons"
                                ? `${filteredCoupons.length} coupon${filteredCoupons.length !== 1 ? "s" : ""}`
                                : `${filteredOffers.length} offer${filteredOffers.length !== 1 ? "s" : ""}`}
                        </span>
                    </div>
                </header>

                {error ? (
                    <div className="mx-4 sm:mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                        {error}
                    </div>
                ) : loading ? (
                    <Skeleton />
                ) : tab === "coupons" ? (
                    filteredCoupons.length === 0 ? (
                        <Empty text={q ? "No coupons match that search." : "No coupons yet. Create one above."} />
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredCoupons.map((c) => (
                                <CouponRow
                                    key={c.id}
                                    coupon={c}
                                    onClick={() => setSelectedCoupon(c)}
                                />
                            ))}
                        </div>
                    )
                ) : filteredOffers.length === 0 ? (
                    <Empty text={q ? "No offers match that search." : "No offers yet. Create one above."} />
                ) : (
                    <div className="divide-y divide-border">
                        {filteredOffers.map((o) => (
                            <OfferRow
                                key={o.id}
                                offer={o}
                                onClick={() => setSelectedOffer(o)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {selectedCoupon && (
                <CouponPanel
                    coupon={selectedCoupon}
                    revoking={revoking === selectedCoupon.id}
                    onRevoke={() => handleRevokeCoupon(selectedCoupon.id)}
                    onClose={() => setSelectedCoupon(null)}
                />
            )}
            {selectedOffer && (
                <OfferPanel
                    offer={selectedOffer}
                    revoking={revoking === selectedOffer.id}
                    onRevoke={() => handleRevokeOffer(selectedOffer.id)}
                    onClose={() => setSelectedOffer(null)}
                />
            )}
        </section>
    );
}

/* ─── Compact rows ─── */

function DiscountSummary({
    perPost,
    monthly,
    yearly,
}: {
    perPost: number;
    monthly: number;
    yearly: number;
}) {
    const allSame = perPost === monthly && monthly === yearly;
    if (allSame) {
        return (
            <>
                <p className="text-[13px] font-semibold text-orange-600 tabular-nums">
                    {monthly}% off
                </p>
                <p className="text-[11px] text-muted-foreground">all plans</p>
            </>
        );
    }
    return (
        <div className="space-y-0.5">
            {[
                { label: "PP", pct: perPost },
                { label: "Mo", pct: monthly },
                { label: "Yr", pct: yearly },
            ].map(({ label, pct }) => (
                <p key={label} className="text-[11px] tabular-nums leading-tight">
                    <span className="text-muted-foreground">{label} </span>
                    <span className="font-semibold text-orange-600">{pct}%</span>
                </p>
            ))}
        </div>
    );
}

function CouponRow({ coupon: c, onClick }: { coupon: AdminCoupon; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors cursor-pointer"
        >
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[13px] font-semibold tracking-wider">{c.code}</span>
                    <StatusPill isActive={c.isActive} isExpired={c.isExpired} />
                </div>
                <p className="text-[11.5px] text-muted-foreground">
                    By {c.createdBy.name ?? c.createdBy.email} · {formatDate(c.createdAt)}
                    {c.redemptionCount > 0 && ` · ${c.redemptionCount} used`}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <DiscountSummary
                    perPost={c.discountPctPerPost}
                    monthly={c.discountPctMonthly}
                    yearly={c.discountPctYearly}
                />
            </div>
        </button>
    );
}

function OfferRow({ offer: o, onClick }: { offer: AdminOffer; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors cursor-pointer"
        >
            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold truncate">{o.title}</span>
                    <StatusPill isActive={o.isActive} isExpired={o.isExpired} />
                </div>
                <p className="text-[11.5px] text-muted-foreground truncate">
                    {o.description
                        ? `${o.description.slice(0, 50)}${o.description.length > 50 ? "…" : ""} · `
                        : ""}
                    By {o.createdBy.name ?? o.createdBy.email} · {formatDate(o.createdAt)}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <DiscountSummary
                    perPost={o.discountPctPerPost}
                    monthly={o.discountPctMonthly}
                    yearly={o.discountPctYearly}
                />
            </div>
        </button>
    );
}

/* ─── Coupon detail panel ─── */

function CouponPanel({
    coupon: c,
    revoking,
    onRevoke,
    onClose,
}: {
    coupon: AdminCoupon;
    revoking: boolean;
    onRevoke: () => void;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    function dismiss() { setVisible(false); setTimeout(onClose, 250); }

    const rows: { label: string; value: string; mono?: boolean; colored?: string }[] = [
        { label: "Code", value: c.code, mono: true },
        { label: "Per Post", value: `${c.discountPctPerPost}% off` },
        { label: "Monthly", value: `${c.discountPctMonthly}% off` },
        { label: "Yearly", value: `${c.discountPctYearly}% off` },
        { label: "Redemptions", value: String(c.redemptionCount) },
        { label: "Created by", value: `${c.createdBy.name ?? "—"} (${c.createdBy.email ?? "—"})` },
        { label: "Created", value: formatDateFull(c.createdAt) },
        { label: "Expires", value: formatDateFull(c.expiresAt) },
        ...(c.revokedAt
            ? [
                  {
                      label: "Revoked by",
                      value: c.revokedBy
                          ? `${c.revokedBy.name ?? "—"} (${c.revokedBy.email ?? "—"})`
                          : "—",
                      colored: "text-rose-500",
                  },
                  { label: "Revoked at", value: formatDateFull(c.revokedAt), colored: "text-rose-500" },
              ]
            : []),
    ];

    return createPortal(
        <>
            <div className={cn("fixed inset-0 z-40 bg-black/30 transition-opacity duration-250", visible ? "opacity-100" : "opacity-0")}
                onClick={dismiss} aria-hidden />
            <div className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col",
                "transition-transform duration-250 ease-out",
                visible ? "translate-x-0" : "translate-x-full",
            )}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[13.5px] font-semibold">Coupon</span>
                    </div>
                    <button type="button" onClick={dismiss}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Hero */}
                <div className="px-5 py-6 border-b border-border text-center bg-secondary/30 shrink-0">
                    <p className="font-mono text-[28px] font-bold tracking-widest">{c.code}</p>
                    <p className="mt-1 text-[13px] text-orange-600 font-semibold">
                        {c.discountPctPerPost === c.discountPctMonthly && c.discountPctMonthly === c.discountPctYearly
                            ? `${c.discountPctMonthly}% off all plans`
                            : `PP ${c.discountPctPerPost}% · Mo ${c.discountPctMonthly}% · Yr ${c.discountPctYearly}%`}
                    </p>
                    <div className="mt-2">
                        <StatusPill isActive={c.isActive} isExpired={c.isExpired} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                            <span className="text-[12px] text-muted-foreground shrink-0">{row.label}</span>
                            <span className={cn("text-[12px] text-right break-all", row.mono ? "font-mono text-[11px]" : "font-medium", row.colored)}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                {c.isActive && !c.isExpired && (
                    <div className="px-5 py-4 border-t border-border shrink-0">
                        <button type="button" disabled={revoking} onClick={onRevoke}
                            className="w-full h-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[12.5px] font-medium hover:bg-rose-100 transition-colors disabled:opacity-50">
                            {revoking ? "Revoking…" : "Revoke coupon"}
                        </button>
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}

/* ─── Offer detail panel ─── */

function OfferPanel({
    offer: o,
    revoking,
    onRevoke,
    onClose,
}: {
    offer: AdminOffer;
    revoking: boolean;
    onRevoke: () => void;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    function dismiss() { setVisible(false); setTimeout(onClose, 250); }

    const rows: { label: string; value: string; colored?: string }[] = [
        ...(o.description ? [{ label: "Description", value: o.description }] : []),
        { label: "Per Post", value: `${o.discountPctPerPost}% off` },
        { label: "Monthly", value: `${o.discountPctMonthly}% off` },
        { label: "Yearly", value: `${o.discountPctYearly}% off` },
        { label: "Created by", value: `${o.createdBy.name ?? "—"} (${o.createdBy.email ?? "—"})` },
        { label: "Created", value: formatDateFull(o.createdAt) },
        { label: "Expires", value: formatDateFull(o.expiresAt) },
        ...(o.revokedAt
            ? [
                  {
                      label: "Revoked by",
                      value: o.revokedBy
                          ? `${o.revokedBy.name ?? "—"} (${o.revokedBy.email ?? "—"})`
                          : "—",
                      colored: "text-rose-500",
                  },
                  { label: "Revoked at", value: formatDateFull(o.revokedAt), colored: "text-rose-500" },
              ]
            : []),
    ];

    return createPortal(
        <>
            <div className={cn("fixed inset-0 z-40 bg-black/30 transition-opacity duration-250", visible ? "opacity-100" : "opacity-0")}
                onClick={dismiss} aria-hidden />
            <div className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col",
                "transition-transform duration-250 ease-out",
                visible ? "translate-x-0" : "translate-x-full",
            )}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-[13.5px] font-semibold">Offer</span>
                    </div>
                    <button type="button" onClick={dismiss}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Hero */}
                <div className="px-5 py-6 border-b border-border text-center bg-secondary/30 shrink-0">
                    <p className="text-[20px] font-bold leading-snug px-2">{o.title}</p>
                    <p className="mt-1 text-[13px] text-orange-600 font-semibold">
                        {o.discountPctPerPost === o.discountPctMonthly && o.discountPctMonthly === o.discountPctYearly
                            ? `${o.discountPctMonthly}% off all plans`
                            : `PP ${o.discountPctPerPost}% · Mo ${o.discountPctMonthly}% · Yr ${o.discountPctYearly}%`}
                    </p>
                    <div className="mt-2">
                        <StatusPill isActive={o.isActive} isExpired={o.isExpired} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
                            <span className="text-[12px] text-muted-foreground shrink-0">{row.label}</span>
                            <span className={cn("text-[12px] font-medium text-right break-words max-w-[55%]", row.colored)}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                {o.isActive && !o.isExpired && (
                    <div className="px-5 py-4 border-t border-border shrink-0">
                        <button type="button" disabled={revoking} onClick={onRevoke}
                            className="w-full h-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[12.5px] font-medium hover:bg-rose-100 transition-colors disabled:opacity-50">
                            {revoking ? "Revoking…" : "Revoke offer"}
                        </button>
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}

/* ─── Create forms ─── */

const fieldCls =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-[11.5px] font-medium text-muted-foreground";

function CreateOfferForm({ onCreated }: { onCreated: () => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [perPost, setPerPost] = useState("");
    const [monthly, setMonthly] = useState("");
    const [yearly, setYearly] = useState("");
    const [fillAll, setFillAll] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    function applyFillAll() {
        if (!fillAll) return;
        setPerPost(fillAll);
        setMonthly(fillAll);
        setYearly(fillAll);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        const pp = parseInt(perPost, 10);
        const mo = parseInt(monthly, 10);
        const yr = parseInt(yearly, 10);
        if (!title.trim() || isNaN(pp) || isNaN(mo) || isNaN(yr)) {
            setErr("Title and all three discount fields are required.");
            return;
        }
        setSaving(true);
        try {
            await adminApi.create_offer({
                title: title.trim(),
                description: description.trim() || undefined,
                defaultDiscountPct: mo,
                discountPctPerPost: pp,
                discountPctMonthly: mo,
                discountPctYearly: yr,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            });
            setTitle(""); setDescription(""); setPerPost(""); setMonthly("");
            setYearly(""); setFillAll(""); setExpiresAt("");
            onCreated();
        } catch (e) {
            setErr(e instanceof ApiClientError ? e.message : "Failed to create offer.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
            <div>
                <h2 className="text-[13.5px] font-semibold">Create offer</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                    Auto-appears on the pricing page for all users — no code needed.
                </p>
            </div>

            {/* Title + description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className={labelCls}>Title <span className="text-destructive">*</span></label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summer Sale" className={fieldCls} required />
                </div>
                <div className="space-y-1">
                    <label className={labelCls}>Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Get 20% off any plan this summer!"
                        className={fieldCls} />
                </div>
            </div>

            {/* Discount section */}
            <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={labelCls}>Discount % per plan <span className="text-destructive">*</span></span>
                    {/* Quick-fill shortcut */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Apply same to all:</span>
                        <input
                            type="number" min={1} max={99} value={fillAll}
                            onChange={(e) => setFillAll(e.target.value)}
                            onBlur={applyFillAll}
                            placeholder="e.g. 20"
                            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="button" onClick={applyFillAll}
                            className="h-7 px-2 rounded-md border border-border bg-background text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            Fill
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Per Post %", val: perPost, set: setPerPost },
                        { label: "Monthly %", val: monthly, set: setMonthly },
                        { label: "Yearly %", val: yearly, set: setYearly },
                    ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                            <label className={labelCls}>{label}</label>
                            <input type="number" min={1} max={99} value={val}
                                onChange={(e) => set(e.target.value)} placeholder="—"
                                className={fieldCls} required />
                        </div>
                    ))}
                </div>
            </div>

            {/* Expiry */}
            <div className="space-y-1">
                <label className={labelCls}>Expires at <span className="text-muted-foreground font-normal">(default: 30 days)</span></label>
                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 w-full sm:w-64 rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {err && <p className="text-[12px] text-destructive">{err}</p>}
            <button type="submit" disabled={saving}
                className="h-9 w-full sm:w-auto px-5 rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Creating…" : "Create offer"}
            </button>
        </form>
    );
}

function CreateCouponForm({ onCreated }: { onCreated: () => void }) {
    const [code, setCode] = useState("");
    const [perPost, setPerPost] = useState("");
    const [monthly, setMonthly] = useState("");
    const [yearly, setYearly] = useState("");
    const [fillAll, setFillAll] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    function applyFillAll() {
        if (!fillAll) return;
        setPerPost(fillAll);
        setMonthly(fillAll);
        setYearly(fillAll);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        const pp = parseInt(perPost, 10);
        const mo = parseInt(monthly, 10);
        const yr = parseInt(yearly, 10);
        if (!code.trim() || isNaN(pp) || isNaN(mo) || isNaN(yr)) {
            setErr("Code and all three discount fields are required.");
            return;
        }
        setSaving(true);
        try {
            await adminApi.create_coupon({
                code: code.trim().toUpperCase(),
                defaultDiscountPct: mo,
                discountPctPerPost: pp,
                discountPctMonthly: mo,
                discountPctYearly: yr,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            });
            setCode(""); setPerPost(""); setMonthly(""); setYearly(""); setFillAll(""); setExpiresAt("");
            onCreated();
        } catch (e) {
            setErr(e instanceof ApiClientError ? e.message : "Failed to create coupon.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
            <div>
                <h2 className="text-[13.5px] font-semibold">Create coupon</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                    Single-use per user — entered at checkout to apply the discount.
                </p>
            </div>

            {/* Code */}
            <div className="space-y-1">
                <label className={labelCls}>Code <span className="text-destructive">*</span></label>
                <input value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="SUMMER20"
                    className={`${fieldCls} max-w-xs font-mono tracking-wide`} required />
            </div>

            {/* Discount section */}
            <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={labelCls}>Discount % per plan <span className="text-destructive">*</span></span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Apply same to all:</span>
                        <input
                            type="number" min={1} max={99} value={fillAll}
                            onChange={(e) => setFillAll(e.target.value)}
                            onBlur={applyFillAll}
                            placeholder="e.g. 20"
                            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="button" onClick={applyFillAll}
                            className="h-7 px-2 rounded-md border border-border bg-background text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            Fill
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Per Post %", val: perPost, set: setPerPost },
                        { label: "Monthly %", val: monthly, set: setMonthly },
                        { label: "Yearly %", val: yearly, set: setYearly },
                    ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                            <label className={labelCls}>{label}</label>
                            <input type="number" min={1} max={99} value={val}
                                onChange={(e) => set(e.target.value)} placeholder="—"
                                className={fieldCls} required />
                        </div>
                    ))}
                </div>
            </div>

            {/* Expiry — own row, matching offer form */}
            <div className="space-y-1">
                <label className={labelCls}>Expires at <span className="text-muted-foreground font-normal">(default: 30 days)</span></label>
                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 w-full sm:w-64 rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {err && <p className="text-[12px] text-destructive">{err}</p>}
            <button type="submit" disabled={saving}
                className="h-9 w-full sm:w-auto px-5 rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Creating…" : "Create coupon"}
            </button>
        </form>
    );
}

/* ─── Shared UI ─── */

function StatusPill({ isActive, isExpired }: { isActive: boolean; isExpired: boolean }) {
    if (!isActive)
        return <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10.5px] font-medium text-rose-600 shrink-0">Revoked</span>;
    if (isExpired)
        return <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground shrink-0">Expired</span>;
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
        </span>
    );
}

function Empty({ text }: { text: string }) {
    return <div className="px-5 py-14 text-center text-[12.5px] text-muted-foreground">{text}</div>;
}

function Skeleton() {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-secondary" />
                        <div className="h-3 w-48 rounded bg-secondary" />
                    </div>
                    <div className="h-4 w-12 rounded bg-secondary shrink-0" />
                </div>
            ))}
        </div>
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateFull(iso: string): string {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
