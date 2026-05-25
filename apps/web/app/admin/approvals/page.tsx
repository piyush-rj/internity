"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { CompanyDetailPanel } from "@/src/components/admin/CompanyDetailPanel";
import {
    companyApi,
    type AdminCompanyListItem,
    type CompanyVerificationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type Tab = CompanyVerificationStatus;

const TABS: { key: Tab; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
];

export default function AdminApprovalsPage() {
    const [tab, setTab] = useState<Tab>("PENDING");
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [items, setItems] = useState<AdminCompanyListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 250ms debounce on the search box — avoids a request on every keystroke
    // while keeping the UI feeling responsive.
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDebounced(query.trim()), 250);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [query]);

    const load = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await companyApi.admin_list({
                status: tab,
                q: debounced || undefined,
                pageSize: 50,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setErrorMessage(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load companies.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [tab, debounced]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    return (
        <>
            <section className="px-6 py-6 space-y-4">
                <header className="space-y-1">
                    <h1 className="text-[18px] font-semibold tracking-tight">
                        Founder approvals
                    </h1>
                    <p className="text-[12.5px] text-muted-foreground">
                        Review companies submitted for verification. Approving
                        unlocks listing posts for every member of the team.
                    </p>
                </header>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Tabs current={tab} onSelect={setTab} />
                    <SearchInput value={query} onChange={setQuery} />
                </div>

                <section className="rounded-xl border border-border bg-card overflow-hidden">
                    <header className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <div className="text-[12.5px] font-medium">
                            {TABS.find((t) => t.key === tab)?.label}
                        </div>
                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {loading ? "…" : `${total} ${total === 1 ? "company" : "companies"}`}
                        </span>
                    </header>

                    {errorMessage ? (
                        <ErrorRow message={errorMessage} />
                    ) : loading && items.length === 0 ? (
                        <Skeleton />
                    ) : items.length === 0 ? (
                        <Empty tab={tab} hasQuery={!!debounced} />
                    ) : (
                        <ul className="divide-y divide-border">
                            {items.map((c) => (
                                <li key={c.id}>
                                    <CompanyRow
                                        company={c}
                                        active={selectedId === c.id}
                                        onClick={() => setSelectedId(c.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </section>

            <CompanyDetailPanel
                companyId={selectedId}
                onClose={() => setSelectedId(null)}
                onMutated={load}
            />
        </>
    );
}

/* ------------------------------ Sub-views -------------------------------- */

function Tabs({
    current,
    onSelect,
}: {
    current: Tab;
    onSelect: (t: Tab) => void;
}) {
    return (
        <div className="inline-flex h-9 rounded-lg border border-border bg-background p-1 gap-1">
            {TABS.map((t) => {
                const active = t.key === current;
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onSelect(t.key)}
                        className={cn(
                            "px-3 rounded-md text-[12.5px] font-medium transition-colors cursor-pointer",
                            active
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

function SearchInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex-1 min-w-0 sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search by company, founder, email, website…"
                className={cn(
                    "w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background",
                    "text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand/30",
                )}
            />
        </div>
    );
}

function CompanyRow({
    company,
    active,
    onClick,
}: {
    company: AdminCompanyListItem;
    active: boolean;
    onClick: () => void;
}) {
    const owner = company.members[0]?.user;
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left px-5 py-3.5 flex items-center gap-3",
                "transition-colors cursor-pointer",
                active ? "bg-secondary/60" : "hover:bg-secondary/40",
            )}
        >
            <Logo name={company.name} logoUrl={company.logoUrl} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium truncate">
                        {company.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        /{company.slug}
                    </span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                    {owner?.name ?? owner?.email ?? "—"}
                    {company.city ? ` · ${company.city}` : ""}
                    {company.industry ? ` · ${company.industry}` : ""}
                </div>
            </div>
            <div className="text-right text-[10.5px] text-muted-foreground tabular-nums shrink-0">
                <div>{company._count.members} member(s)</div>
                <div>{company._count.listings} live listing(s)</div>
            </div>
            <SubmittedAt iso={company.submittedAt} />
        </button>
    );
}

function SubmittedAt({ iso }: { iso: string | null }) {
    if (!iso) return null;
    const date = new Date(iso);
    const display = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
    return (
        <span className="hidden sm:inline-block w-16 text-right text-[10.5px] text-muted-foreground shrink-0">
            {display}
        </span>
    );
}

function Logo({
    name,
    logoUrl,
}: {
    name: string;
    logoUrl: string | null;
}) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-9 w-9 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-9 w-9 rounded-md flex items-center justify-center bg-secondary text-foreground text-[13px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Empty({ tab, hasQuery }: { tab: Tab; hasQuery: boolean }) {
    const message = hasQuery
        ? "No matches."
        : tab === "PENDING"
          ? "No companies are waiting on review. Nice work."
          : tab === "APPROVED"
            ? "No approved companies yet."
            : "No rejected companies.";
    return (
        <div className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
            {message}
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
                    <div className="h-9 w-9 rounded-md bg-secondary shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-1/3 rounded-full bg-secondary" />
                        <div className="h-2.5 w-1/2 rounded-full bg-secondary" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
