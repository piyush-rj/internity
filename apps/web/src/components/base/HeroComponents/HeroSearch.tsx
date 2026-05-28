"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, MapPin, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { listingApi, type ListingWithCompany } from "@/src/lib/api";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

// Landing-page search. Anyone (signed-in or out) can type and see live
// suggestions from the public /listing endpoint. Auth is only required at
// the moment of navigation: signed-out users get the auth dialog with the
// destination encoded as the post-sign-in next-path; signed-in users go
// straight there.
export function HeroSearch() {
    const router = useRouter();
    const openDialog = useAuthDialog((s) => s.openDialog);
    // Read sign-in state from the Supabase-backed session store, which is
    // hydrated globally by SessionSetter in the root layout. The Me store
    // (useMeStore) is only bootstrapped under /home and /admin, so it's
    // always null on the landing page — using it here would mis-flag
    // signed-in users as signed-out.
    const signedIn = useUserSessionStore((s) => !!s.session?.user?.id);

    const [query, setQuery] = useState("");
    const [city, setCity] = useState("");
    const [suggestions, setSuggestions] = useState<ListingWithCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    // Debounced fetch of suggestions whenever the query or city changes.
    useEffect(() => {
        const q = query.trim();
        const c = city.trim();
        if (q.length < 2 && c.length < 2) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSuggestions([]);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        const t = window.setTimeout(async () => {
            setLoading(true);
            try {
                const res = await listingApi.list({
                    q: q || undefined,
                    city: c || undefined,
                    pageSize: 6,
                });
                if (ctrl.signal.aborted) return;
                setSuggestions(res.items);
                setActiveIdx(-1);
            } catch {
                if (!ctrl.signal.aborted) setSuggestions([]);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        }, 220);
        return () => {
            ctrl.abort();
            window.clearTimeout(t);
        };
    }, [query, city]);

    // Close on outside click or Escape.
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node))
                setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function buildListPath(): string {
        const params = new URLSearchParams();
        const q = query.trim();
        const c = city.trim();
        if (q) params.set("q", q);
        if (c) params.set("city", c);
        const qs = params.toString();
        return qs ? `/home/internships?${qs}` : "/home/internships";
    }

    function navigate(path: string) {
        if (!signedIn) {
            openDialog(path);
            return;
        }
        router.push(path);
    }

    function onSubmit() {
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
            navigate(`/home/listings/${suggestions[activeIdx].id}`);
            return;
        }
        navigate(buildListPath());
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => (i + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx(
                (i) => (i - 1 + suggestions.length) % suggestions.length,
            );
        }
    }

    const showPanel =
        open &&
        (loading || suggestions.length > 0 || trimmedHasQuery(query, city));

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative mx-auto mt-9 w-full max-w-3xl",
                "flex flex-col sm:flex-row items-stretch sm:items-center gap-2",
            )}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
                className={cn(
                    "flex-1 min-w-0 sm:h-12 relative",
                    "rounded-lg border border-border bg-white",
                    "shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]",
                    "flex flex-col sm:flex-row items-stretch overflow-visible",
                )}
                role="combobox"
                aria-expanded={showPanel}
                aria-controls={listboxId}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0 px-4 py-1.5">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder="Search role, skill, or company"
                        aria-label="Search role, skill, or company"
                        aria-autocomplete="list"
                        aria-controls={listboxId}
                        className={cn(
                            "w-full bg-transparent outline-none text-[14px]",
                            "placeholder:text-muted-foreground/80",
                        )}
                    />
                </div>
                <div
                    aria-hidden
                    className="hidden sm:block w-px self-stretch bg-border my-2"
                />
                <div
                    aria-hidden
                    className="block sm:hidden h-px self-stretch bg-border mx-4"
                />
                <div className="flex items-center gap-2 sm:w-56 px-4 py-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                            setCity(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder="Location"
                        aria-label="Location"
                        aria-autocomplete="list"
                        aria-controls={listboxId}
                        className={cn(
                            "w-full bg-transparent outline-none text-[14px]",
                            "placeholder:text-muted-foreground/80",
                        )}
                    />
                </div>
                <div className="p-1.5">
                    <Button
                        type="submit"
                        aria-label="Search"
                        className={cn(
                            "h-9 w-9 p-0 rounded-lg cursor-pointer bg-brand/90 text-white transition-colors transform duration-200",
                        )}
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {showPanel && (
                    <SuggestionPanel
                        id={listboxId}
                        loading={loading}
                        items={suggestions}
                        activeIdx={activeIdx}
                        onHover={setActiveIdx}
                        onPick={(id) => {
                            setOpen(false);
                            navigate(`/home/listings/${id}`);
                        }}
                        onSeeAll={() => {
                            setOpen(false);
                            navigate(buildListPath());
                        }}
                    />
                )}
            </form>
            <Button
                onClick={() => navigate("/home")}
                variant={"exec-dark"}
                className={cn(
                    "shrink-0 inline-flex items-center gap-2 rounded-lg",
                    "text-white px-4 sm:h-11.75 text-[14px] font-medium cursor-pointer",
                )}
            >
                Go to dashboard
            </Button>
        </div>
    );
}

function trimmedHasQuery(q: string, c: string): boolean {
    return q.trim().length >= 2 || c.trim().length >= 2;
}

function SuggestionPanel({
    id,
    loading,
    items,
    activeIdx,
    onHover,
    onPick,
    onSeeAll,
}: {
    id: string;
    loading: boolean;
    items: ListingWithCompany[];
    activeIdx: number;
    onHover: (i: number) => void;
    onPick: (id: string) => void;
    onSeeAll: () => void;
}) {
    return (
        <div
            id={id}
            role="listbox"
            className={cn(
                "absolute left-0 right-0 top-full mt-2 z-20",
                "rounded-lg border border-border bg-white",
                "shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)]",
                "overflow-hidden",
            )}
        >
            {loading && items.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-muted-foreground">
                    Searching…
                </div>
            ) : items.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-muted-foreground">
                    No matches - try a different keyword
                </div>
            ) : (
                <>
                    <ul className="max-h-80 overflow-y-auto p-1.5">
                        {items.map((l, i) => {
                            const active = i === activeIdx;
                            return (
                                <li
                                    key={l.id}
                                    role="option"
                                    aria-selected={active}
                                >
                                    <button
                                        type="button"
                                        onMouseEnter={() => onHover(i)}
                                        onClick={() => onPick(l.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md cursor-pointer",
                                            "transition-colors",
                                            active
                                                ? "bg-secondary"
                                                : "hover:bg-secondary/60",
                                        )}
                                    >
                                        <span className="h-8 w-8 shrink-0 rounded-md border border-border bg-secondary flex items-center justify-center overflow-hidden">
                                            {l.company.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={l.company.logoUrl}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13.5px] font-medium truncate">
                                                {l.title}
                                            </span>
                                            <span className="block text-[11.5px] text-muted-foreground truncate">
                                                {l.company.name}
                                                {l.city ? ` · ${l.city}` : ""}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                                            {l.mode}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <button
                        type="button"
                        onClick={onSeeAll}
                        className={cn(
                            "w-full border-t border-border px-5 py-2.5 text-left cursor-pointer",
                            "text-[12.5px] font-medium text-brand hover:bg-secondary/60",
                        )}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            See all matches
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
