"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";
import { ListingDetailPanel } from "@/src/components/admin/ListingDetailPanel";
import {
    listingApi,
    type AdminListingListItem,
    type AdminListingStateFilter,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

const TABS: { key: AdminListingStateFilter; label: string }[] = [
    { key: "live", label: "Live" },
    { key: "takendown", label: "Taken down" },
    { key: "closed", label: "Closed" },
    { key: "all", label: "All" },
];

export default function AdminListingsPage() {
    const [state, setState] = useState<AdminListingStateFilter>("live");
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [items, setItems] = useState<AdminListingListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

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
            const res = await listingApi.admin_list({
                state,
                q: debounced || undefined,
                pageSize: 50,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setErrorMessage(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load listings.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [state, debounced]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const selected = items.find((it) => it.id === selectedId) ?? null;

    return (
        <>
            <section className="px-6 py-6 space-y-4">
                <header className="space-y-1">
                    <h1 className="text-[18px] font-semibold tracking-tight">
                        Listings
                    </h1>
                    <p className="text-[12.5px] text-muted-foreground">
                        Every internship and job posted on SpiderSkill. Open a
                        listing to take it down with a warning note.
                    </p>
                </header>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Tabs current={state} onSelect={setState} />
                    <SearchInput value={query} onChange={setQuery} />
                </div>

                <section className="rounded-xl border border-border bg-card overflow-hidden">
                    <header className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <div className="text-[12.5px] font-medium">
                            {TABS.find((t) => t.key === state)?.label}
                        </div>
                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {loading
                                ? "…"
                                : `${total} ${total === 1 ? "listing" : "listings"}`}
                        </span>
                    </header>

                    {errorMessage ? (
                        <ErrorRow message={errorMessage} />
                    ) : loading && items.length === 0 ? (
                        <Skeleton />
                    ) : items.length === 0 ? (
                        <Empty state={state} hasQuery={!!debounced} />
                    ) : (
                        <ul className="divide-y divide-border">
                            {items.map((l) => (
                                <li key={l.id}>
                                    <ListingRow
                                        listing={l}
                                        active={selectedId === l.id}
                                        onClick={() => setSelectedId(l.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </section>

            <ListingDetailPanel
                listing={selected}
                onClose={() => setSelectedId(null)}
                onMutated={load}
            />
        </>
    );
}

function Tabs({
    current,
    onSelect,
}: {
    current: AdminListingStateFilter;
    onSelect: (t: AdminListingStateFilter) => void;
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
                placeholder="Search by title, company, founder, skill…"
                className={cn(
                    "w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background",
                    "text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand/30",
                )}
            />
        </div>
    );
}

function ListingRow({
    listing,
    active,
    onClick,
}: {
    listing: AdminListingListItem;
    active: boolean;
    onClick: () => void;
}) {
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
            <Logo
                name={listing.company.name}
                logoUrl={listing.company.logoUrl}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium truncate">
                        {listing.title}
                    </span>
                    <StateChip listing={listing} />
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                    {listing.company.name}
                    {listing.city ? ` · ${listing.city}` : ""} · {listing.type}{" "}
                    · {listing.mode}
                </div>
            </div>
            <div className="text-right text-[10.5px] text-muted-foreground tabular-nums shrink-0">
                <div>{listing._count.applications} applicants</div>
                <div>{formatShort(listing.createdAt)}</div>
            </div>
        </button>
    );
}

function StateChip({ listing }: { listing: AdminListingListItem }) {
    if (listing.takenDownAt) {
        return (
            <Chip
                Icon={AlertTriangle}
                label="Taken down"
                classes="bg-red-100 text-red-700"
            />
        );
    }
    if (listing.closedAt) {
        return (
            <Chip
                Icon={Clock}
                label="Closed"
                classes="bg-muted text-muted-foreground"
            />
        );
    }
    return (
        <Chip
            Icon={CheckCircle2}
            label="Live"
            classes="bg-emerald-100 text-emerald-700"
        />
    );
}

function Chip({
    Icon,
    label,
    classes,
}: {
    Icon: typeof CheckCircle2;
    label: string;
    classes: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium shrink-0",
                classes,
            )}
        >
            <Icon className="h-2.5 w-2.5" />
            {label}
        </span>
    );
}

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
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

function Empty({
    state,
    hasQuery,
}: {
    state: AdminListingStateFilter;
    hasQuery: boolean;
}) {
    const message = hasQuery
        ? "No matches."
        : state === "live"
          ? "No live listings."
          : state === "takendown"
            ? "Nothing has been taken down."
            : state === "closed"
              ? "No closed listings."
              : "No listings yet.";
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

function formatShort(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
}
