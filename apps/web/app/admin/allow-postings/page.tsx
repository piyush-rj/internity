"use client";

import { createPortal } from "react-dom";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Search, Building2, X, CheckCircle, XCircle } from "lucide-react";
import {
    adminApi,
    type AdminCompanySearchResult,
    type AdminFreePostingGrant,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

export default function AllowPostingsPage() {
    const [grants, setGrants] = useState<AdminFreePostingGrant[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [selected, setSelected] = useState<AdminFreePostingGrant | null>(null);
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_free_posting_grants({ pageSize: 100 });
            setGrants(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : "Couldn't load grants.");
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
            await adminApi.revoke_free_posting_grant(id);
            setSelected(null);
            await load();
        } catch (err) {
            alert(err instanceof ApiClientError ? err.message : "Failed to revoke.");
        } finally {
            setRevoking(null);
        }
    }

    const q = query.trim().toLowerCase();
    const filtered = useMemo(
        () =>
            q
                ? grants.filter(
                      (g) =>
                          g.company.name.toLowerCase().includes(q) ||
                          g.grantedBy.name?.toLowerCase().includes(q) ||
                          g.grantedBy.email?.toLowerCase().includes(q),
                  )
                : grants,
        [grants, q],
    );

    return (
        <section className="px-3 sm:px-6 py-4 sm:py-6 space-y-5">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Allow Postings
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    Grant companies additional free job posting slots beyond the
                    default one. Grantees are notified immediately.
                </p>
            </header>

            <GrantForm onCreated={load} />

            {/* History */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border">
                    <span className="text-[12.5px] font-medium">
                        Grant history
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Company, admin…"
                                className="h-8 w-44 sm:w-52 rounded-lg border border-border bg-background pl-8 pr-7 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <span className="text-[11.5px] text-muted-foreground tabular-nums shrink-0">
                            {loading ? "…" : `${filtered.length} of ${total}`}
                        </span>
                    </div>
                </header>

                {error ? (
                    <div className="mx-4 sm:mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                        {error}
                    </div>
                ) : loading && grants.length === 0 ? (
                    <Skeleton />
                ) : filtered.length === 0 ? (
                    <div className="px-5 py-14 text-center text-[12.5px] text-muted-foreground">
                        {q ? "No grants match that search." : "No grants yet. Use the form above."}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map((g) => (
                            <GrantRow
                                key={g.id}
                                grant={g}
                                onClick={() => setSelected(g)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {selected && (
                <GrantPanel
                    grant={selected}
                    revoking={revoking === selected.id}
                    onRevoke={() => handleRevoke(selected.id)}
                    onClose={() => setSelected(null)}
                />
            )}
        </section>
    );
}

/* ─── Grant form with debounced company search ─── */

function GrantForm({ onCreated }: { onCreated: () => void }) {
    const [searchInput, setSearchInput] = useState("");
    const [results, setResults] = useState<AdminCompanySearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedCompany, setSelectedCompany] =
        useState<AdminCompanySearchResult | null>(null);
    const [postings, setPostings] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function onSearchChange(val: string) {
        setSearchInput(val);
        setSelectedCompany(null);
        setResults([]);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val.trim()) return;
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await adminApi.search_companies(val.trim());
                setResults(res.companies);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setSuccess(null);
        if (!selectedCompany) { setErr("Select a company first."); return; }
        const n = parseInt(postings, 10);
        if (isNaN(n) || n < 1) { setErr("Enter a valid number of postings."); return; }
        setSaving(true);
        try {
            const res = await adminApi.create_free_posting_grant({
                companyId: selectedCompany.id,
                grantedPostings: n,
                note: note.trim() || undefined,
            });
            setSuccess(`Granted ${n} free posting${n === 1 ? "" : "s"} to ${res.grant.companyName}.`);
            setSearchInput(""); setSelectedCompany(null); setResults([]);
            setPostings(""); setNote("");
            onCreated();
        } catch (e) {
            setErr(e instanceof ApiClientError ? e.message : "Failed to grant.");
        } finally {
            setSaving(false);
        }
    }

    const fieldCls = "h-9 w-full rounded-lg border border-border bg-background px-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring";
    const labelCls = "text-[11.5px] font-medium text-muted-foreground";

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
            <div>
                <h2 className="text-[13.5px] font-semibold">Grant free postings</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                    Search for a company by name, set the quota, and the founder is notified instantly.
                </p>
            </div>

            {/* Company search */}
            <div className="space-y-1">
                <label className={labelCls}>Company <span className="text-destructive">*</span></label>
                {selectedCompany ? (
                    <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="flex-1 text-[12.5px] font-medium truncate">{selectedCompany.name}</span>
                        <button type="button" onClick={() => { setSelectedCompany(null); setSearchInput(""); setResults([]); }}
                            className="text-emerald-500 hover:text-emerald-700 shrink-0">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            value={searchInput}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Type company name…"
                            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {(results.length > 0 || searching) && (
                            <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                {searching ? (
                                    <div className="px-3 py-2.5 text-[12px] text-muted-foreground">Searching…</div>
                                ) : results.length === 0 ? (
                                    <div className="px-3 py-2.5 text-[12px] text-muted-foreground">No companies found.</div>
                                ) : (
                                    results.map((c) => (
                                        <button key={c.id} type="button"
                                            onClick={() => { setSelectedCompany(c); setSearchInput(c.name); setResults([]); }}
                                            className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-secondary/50 transition-colors">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12.5px] font-medium truncate">{c.name}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {c.isPremium ? "Premium" : c.freeListingUsed ? "Free used" : "Free available"}
                                                    {c.freePostingGrants.length > 0 && ` · ${c.freePostingGrants.reduce((s, g) => s + g.grantedPostings - g.usedPostings, 0)} granted remaining`}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className={labelCls}>Number of free postings <span className="text-destructive">*</span></label>
                    <input type="number" min={1} max={1000} value={postings}
                        onChange={(e) => setPostings(e.target.value)}
                        placeholder="e.g. 5" className={fieldCls} required />
                </div>
                <div className="space-y-1">
                    <label className={labelCls}>Note <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Partnership deal" className={fieldCls} />
                </div>
            </div>

            {err && <p className="text-[12px] text-destructive">{err}</p>}
            {success && (
                <p className="text-[12px] text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />{success}
                </p>
            )}

            <button type="submit" disabled={saving || !selectedCompany}
                className="h-9 w-full sm:w-auto px-5 rounded-lg bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Granting…" : "Grant postings"}
            </button>
        </form>
    );
}

/* ─── Compact grant row ─── */

function GrantRow({ grant: g, onClick }: { grant: AdminFreePostingGrant; onClick: () => void }) {
    const remaining = g.remainingPostings;
    return (
        <button type="button" onClick={onClick}
            className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold truncate">{g.company.name}</span>
                    <StatusPill isActive={g.isActive} />
                </div>
                <p className="text-[11.5px] text-muted-foreground">
                    By {g.grantedBy.name ?? g.grantedBy.email} · {formatDate(g.createdAt)}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <p className="text-[13px] font-semibold tabular-nums">{g.grantedPostings} posts</p>
                <p className={cn("text-[11px] tabular-nums",
                    !g.isActive ? "text-muted-foreground" : remaining > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                    {g.isActive ? `${remaining} left` : "revoked"}
                </p>
            </div>
        </button>
    );
}

/* ─── Detail slide panel ─── */

function GrantPanel({
    grant: g,
    revoking,
    onRevoke,
    onClose,
}: {
    grant: AdminFreePostingGrant;
    revoking: boolean;
    onRevoke: () => void;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    function dismiss() { setVisible(false); setTimeout(onClose, 250); }

    const rows: { label: string; value: string; colored?: string }[] = [
        { label: "Company", value: g.company.name },
        { label: "Granted", value: `${g.grantedPostings} postings` },
        { label: "Used", value: String(g.usedPostings) },
        { label: "Remaining", value: String(g.remainingPostings),
            colored: g.remainingPostings > 0 ? "text-emerald-600" : undefined },
        { label: "Granted by", value: `${g.grantedBy.name ?? "—"} (${g.grantedBy.email ?? "—"})` },
        { label: "Granted on", value: formatDateFull(g.createdAt) },
        ...(g.note ? [{ label: "Note", value: g.note }] : []),
        ...(g.revokedAt
            ? [
                  { label: "Revoked by",
                    value: g.revokedBy ? `${g.revokedBy.name ?? "—"} (${g.revokedBy.email ?? "—"})` : "—",
                    colored: "text-rose-500" },
                  { label: "Revoked on", value: formatDateFull(g.revokedAt), colored: "text-rose-500" },
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
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[13.5px] font-semibold">Posting Grant</span>
                    </div>
                    <button type="button" onClick={dismiss}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Hero */}
                <div className="px-5 py-6 border-b border-border text-center bg-secondary/30 shrink-0">
                    <p className="text-[22px] font-bold tabular-nums">{g.grantedPostings}</p>
                    <p className="text-[13px] text-muted-foreground">free postings granted</p>
                    <div className="mt-1 flex items-center justify-center gap-3 text-[12px] tabular-nums">
                        <span className="text-emerald-600 font-medium">{g.remainingPostings} remaining</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{g.usedPostings} used</span>
                    </div>
                    <div className="mt-2"><StatusPill isActive={g.isActive} /></div>
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

                {g.isActive && (
                    <div className="px-5 py-4 border-t border-border shrink-0">
                        <button type="button" disabled={revoking} onClick={onRevoke}
                            className="w-full h-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[12.5px] font-medium hover:bg-rose-100 transition-colors disabled:opacity-50">
                            {revoking ? "Revoking…" : "Revoke grant"}
                        </button>
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}

function StatusPill({ isActive }: { isActive: boolean }) {
    if (!isActive)
        return <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10.5px] font-medium text-rose-600 shrink-0">
            <XCircle className="h-2.5 w-2.5" />Revoked
        </span>;
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 shrink-0">
        <CheckCircle className="h-2.5 w-2.5" />Active
    </span>;
}

function Skeleton() {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-36 rounded bg-secondary" />
                        <div className="h-3 w-48 rounded bg-secondary" />
                    </div>
                    <div className="h-4 w-16 rounded bg-secondary shrink-0" />
                </div>
            ))}
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateFull(iso: string) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
