"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";
import { CompanyDetailPanel } from "@/src/components/admin/CompanyDetailPanel";
import {
    employerApi,
    type AdminFounderListItem,
    type CompanyVerificationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

export default function AdminFoundersPage() {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [items, setItems] = useState<AdminFounderListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
        null,
    );

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
            const res = await employerApi.admin_list({
                q: debounced || undefined,
                pageSize: 50,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setErrorMessage(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load founders.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [debounced]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    return (
        <>
            <section className="px-6 py-6 space-y-4">
                <header className="space-y-1">
                    <h1 className="text-[18px] font-semibold tracking-tight">
                        Founders
                    </h1>
                    <p className="text-[12.5px] text-muted-foreground">
                        Every employer on SpiderSkill. Click a row to open their
                        company + profile in detail.
                    </p>
                </header>

                <SearchInput value={query} onChange={setQuery} />

                <section className="rounded-xl border border-border bg-card overflow-hidden">
                    <header className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <div className="text-[12.5px] font-medium">
                            All founders
                        </div>
                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {loading
                                ? "…"
                                : `${total} ${total === 1 ? "founder" : "founders"}`}
                        </span>
                    </header>

                    {errorMessage ? (
                        <ErrorRow message={errorMessage} />
                    ) : loading && items.length === 0 ? (
                        <Skeleton />
                    ) : items.length === 0 ? (
                        <Empty hasQuery={!!debounced} />
                    ) : (
                        <ul className="divide-y divide-border">
                            {items.map((f) => (
                                <li key={f.id}>
                                    <FounderRow
                                        founder={f}
                                        active={
                                            selectedCompanyId ===
                                            f.user.companyMemberships[0]
                                                ?.companyId
                                        }
                                        onClick={() => {
                                            const cid =
                                                f.user.companyMemberships[0]
                                                    ?.companyId;
                                            if (cid) setSelectedCompanyId(cid);
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </section>

            <CompanyDetailPanel
                companyId={selectedCompanyId}
                onClose={() => setSelectedCompanyId(null)}
                onMutated={load}
            />
        </>
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
                placeholder="Search by name, email, company, job title…"
                className={cn(
                    "w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background",
                    "text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand/30",
                )}
            />
        </div>
    );
}

function FounderRow({
    founder,
    active,
    onClick,
}: {
    founder: AdminFounderListItem;
    active: boolean;
    onClick: () => void;
}) {
    const company = founder.user.companyMemberships[0]?.company;
    const fullName = [founder.firstName, founder.lastName]
        .filter(Boolean)
        .join(" ");
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
            <Avatar
                name={fullName || founder.user.email || "?"}
                imageUrl={founder.user.image}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium truncate">
                        {fullName || founder.user.name || founder.user.email}
                    </span>
                    {founder.user.isBanned && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[9.5px] font-medium">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Disabled
                        </span>
                    )}
                    {founder.jobTitle && (
                        <span className="text-[11px] text-muted-foreground truncate">
                            · {founder.jobTitle}
                        </span>
                    )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                    {company ? company.name : "No company yet"}
                    {founder.user.email ? ` · ${founder.user.email}` : ""}
                </div>
            </div>
            {company && <CompanyStatus status={company.verificationStatus} />}
        </button>
    );
}

function CompanyStatus({ status }: { status: CompanyVerificationStatus }) {
    const cfg = STATUS[status];
    return (
        <span
            className={cn(
                "shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium",
                cfg.classes,
            )}
        >
            <cfg.Icon className="h-2.5 w-2.5" />
            {cfg.label}
        </span>
    );
}

const STATUS: Record<
    CompanyVerificationStatus,
    {
        Icon: typeof CheckCircle2;
        label: string;
        classes: string;
    }
> = {
    PENDING: {
        Icon: Clock,
        label: "Pending",
        classes: "bg-amber-100 text-amber-800",
    },
    APPROVED: {
        Icon: CheckCircle2,
        label: "Approved",
        classes: "bg-emerald-100 text-emerald-700",
    },
    REJECTED: {
        Icon: AlertTriangle,
        label: "Rejected",
        classes: "bg-red-100 text-red-700",
    },
};

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
    if (imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imageUrl}
                alt={`${name} avatar`}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-9 w-9 rounded-full flex items-center justify-center bg-secondary text-foreground text-[13px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Empty({ hasQuery }: { hasQuery: boolean }) {
    return (
        <div className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
            {hasQuery ? "No matches." : "No founders on the platform yet."}
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
                    <div className="h-9 w-9 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-1/3 rounded-full bg-secondary" />
                        <div className="h-2.5 w-1/2 rounded-full bg-secondary" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
