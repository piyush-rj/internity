"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Building2,
    ChevronDown,
    Home,
    MapPin,
    Search,
} from "lucide-react";
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

type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";

type LocationOption =
    | { kind: "mode"; mode: WorkMode; label: string }
    | { kind: "city"; city: string; label: string }
    | { kind: "other"; label: string };

const PRESET_LOCATIONS: LocationOption[] = [
    { kind: "mode", mode: "REMOTE", label: "Work from home" },
    { kind: "mode", mode: "HYBRID", label: "Hybrid" },
    { kind: "city", city: "Bengaluru", label: "Bengaluru" },
    { kind: "city", city: "Mumbai", label: "Mumbai" },
    { kind: "city", city: "Delhi NCR", label: "Delhi NCR" },
    { kind: "city", city: "Hyderabad", label: "Hyderabad" },
    { kind: "city", city: "Pune", label: "Pune" },
    { kind: "city", city: "Chennai", label: "Chennai" },
    { kind: "other", label: "Other" },
];

export function HeroSearch() {
    const router = useRouter();
    const openDialog = useAuthDialog((s) => s.openDialog);
    const signedIn = useUserSessionStore((s) => !!s.session?.user?.id);

    const [query, setQuery] = useState("");
    // Location is either a WorkMode (Remote/Hybrid) or a city string. We
    // keep them in separate state so the URL we emit can use the right
    // query param (?mode= vs ?city=). cityCustom holds the value the user
    // typed when picking "Other".
    const [mode, setMode] = useState<WorkMode | null>(null);
    const [city, setCity] = useState<string>("");
    const [cityCustom, setCityCustom] = useState<string>("");

    const [suggestions, setSuggestions] = useState<ListingWithCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [locOpen, setLocOpen] = useState(false);
    // When the user picks "Other" from the dropdown, we swap the option
    // list for an inline text input so they can type a free-form location.
    const [otherMode, setOtherMode] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();
    const locListId = useId();

    const cityForApi = city.trim() || cityCustom.trim();

    // Debounced fetch of search suggestions whenever the query or city
    // changes.
    useEffect(() => {
        const q = query.trim();
        const c = cityForApi;
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
                    mode: mode || undefined,
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
    }, [query, cityForApi, mode]);

    // Close any open popover on outside click or Escape.
    useEffect(() => {
        if (!suggestOpen && !locOpen) return;
        function onDown(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setSuggestOpen(false);
                setLocOpen(false);
                setOtherMode(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setSuggestOpen(false);
                setLocOpen(false);
                setOtherMode(false);
            }
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [suggestOpen, locOpen]);

    // Autofocus the custom-location input when "Other" is picked.
    useEffect(() => {
        if (otherMode) customInputRef.current?.focus();
    }, [otherMode]);

    function buildListPath(): string {
        const params = new URLSearchParams();
        const q = query.trim();
        const c = cityForApi;
        if (q) params.set("q", q);
        if (c) params.set("city", c);
        if (mode) params.set("mode", mode);
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
        if (!suggestOpen || suggestions.length === 0) return;
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

    function pickPreset(opt: LocationOption) {
        if (opt.kind === "mode") {
            setMode(opt.mode);
            setCity("");
            setCityCustom("");
            setOtherMode(false);
            setLocOpen(false);
        } else if (opt.kind === "city") {
            setCity(opt.city);
            setMode(null);
            setCityCustom("");
            setOtherMode(false);
            setLocOpen(false);
        } else {
            // Other → swap the panel for a free-form input
            setMode(null);
            setCity("");
            setOtherMode(true);
        }
    }

    function clearLocation() {
        setMode(null);
        setCity("");
        setCityCustom("");
        setOtherMode(false);
    }

    const showSuggestPanel =
        suggestOpen &&
        (loading || suggestions.length > 0 || query.trim().length >= 2);

    const locationLabel = (() => {
        if (mode === "REMOTE") return "Work from home";
        if (mode === "HYBRID") return "Hybrid";
        if (city) return city;
        if (cityCustom) return cityCustom;
        return "Location";
    })();
    const hasLocation = !!(mode || city || cityCustom);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative mx-auto mt-7 sm:mt-9 w-full max-w-3xl",
                "flex flex-col sm:flex-row items-stretch sm:items-center gap-2",
            )}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
                className={cn(
                    "flex-1 min-w-0 h-12 relative",
                    "rounded-lg border border-border bg-white",
                    "shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]",
                    "flex flex-row items-stretch overflow-visible",
                )}
                role="combobox"
                aria-expanded={showSuggestPanel}
                aria-controls={listboxId}
                aria-haspopup="listbox"
            >
                <label className="flex items-center gap-2 flex-1 min-w-0 pl-3 sm:pl-4 pr-2">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSuggestOpen(true);
                        }}
                        onFocus={() => {
                            setSuggestOpen(true);
                            setLocOpen(false);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Search role or company"
                        aria-label="Search role, skill, or company"
                        aria-autocomplete="list"
                        aria-controls={listboxId}
                        className={cn(
                            "w-full bg-transparent outline-none text-[14px]",
                            "placeholder:text-muted-foreground/80",
                        )}
                    />
                </label>

                <div
                    aria-hidden
                    className="w-px self-stretch bg-border my-2"
                />

                {/* Location dropdown trigger */}
                <div className="relative flex items-stretch shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setLocOpen((o) => !o);
                            setSuggestOpen(false);
                        }}
                        aria-haspopup="listbox"
                        aria-expanded={locOpen}
                        aria-controls={locListId}
                        aria-label={
                            hasLocation
                                ? `Location: ${locationLabel}`
                                : "Choose location"
                        }
                        className={cn(
                            "inline-flex items-center gap-1 sm:gap-2",
                            "px-2 sm:px-3 text-[13px] sm:text-[14px] font-medium",
                            "max-w-28 sm:max-w-none",
                            "text-foreground hover:bg-secondary/60",
                            "transition-colors cursor-pointer rounded-none",
                        )}
                    >
                        {mode === "REMOTE" ? (
                            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        {/* On mobile only show the label when a value
                            has been picked — empty state stays a compact
                            icon + chevron. */}
                        <span
                            className={cn(
                                "truncate",
                                !hasLocation && "hidden sm:inline",
                                !hasLocation && "text-muted-foreground/80",
                            )}
                        >
                            {locationLabel}
                        </span>
                        <ChevronDown
                            className={cn(
                                "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform",
                                locOpen && "rotate-180",
                            )}
                        />
                    </button>
                </div>

                <div className="p-1.5 shrink-0">
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

                {showSuggestPanel && (
                    <SuggestionPanel
                        id={listboxId}
                        loading={loading}
                        items={suggestions}
                        activeIdx={activeIdx}
                        onHover={setActiveIdx}
                        onPick={(id) => {
                            setSuggestOpen(false);
                            navigate(`/home/listings/${id}`);
                        }}
                        onSeeAll={() => {
                            setSuggestOpen(false);
                            navigate(buildListPath());
                        }}
                    />
                )}

                {locOpen && (
                    <LocationPanel
                        id={locListId}
                        otherMode={otherMode}
                        customValue={cityCustom}
                        onCustomChange={setCityCustom}
                        customInputRef={customInputRef}
                        hasSelection={hasLocation}
                        selectedMode={mode}
                        selectedCity={city}
                        onPick={pickPreset}
                        onClear={clearLocation}
                        onCustomDone={() => {
                            setLocOpen(false);
                            setOtherMode(false);
                        }}
                    />
                )}
            </form>
            <Button
                onClick={() => navigate("/home")}
                variant={"exec-dark"}
                className={cn(
                    "shrink-0 inline-flex items-center justify-center gap-2 rounded-lg",
                    "text-white px-4 h-11 sm:h-11.5 text-[14px] font-medium cursor-pointer",
                )}
            >
                Go to dashboard
            </Button>
        </div>
    );
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

function LocationPanel({
    id,
    otherMode,
    customValue,
    onCustomChange,
    customInputRef,
    hasSelection,
    selectedMode,
    selectedCity,
    onPick,
    onClear,
    onCustomDone,
}: {
    id: string;
    otherMode: boolean;
    customValue: string;
    onCustomChange: (v: string) => void;
    customInputRef: React.RefObject<HTMLInputElement | null>;
    hasSelection: boolean;
    selectedMode: WorkMode | null;
    selectedCity: string;
    onPick: (opt: LocationOption) => void;
    onClear: () => void;
    onCustomDone: () => void;
}) {
    return (
        <div
            id={id}
            role="listbox"
            className={cn(
                "absolute right-0 left-0 sm:left-auto top-full mt-2 z-30",
                "sm:w-72 rounded-lg border border-border bg-white",
                "shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)]",
                "overflow-hidden",
            )}
        >
            {otherMode ? (
                <div className="p-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
                    <input
                        ref={customInputRef}
                        type="text"
                        value={customValue}
                        onChange={(e) => onCustomChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                onCustomDone();
                            }
                        }}
                        placeholder="Type a city"
                        aria-label="Type a city"
                        className={cn(
                            "flex-1 min-w-0 bg-transparent outline-none text-[14px]",
                            "placeholder:text-muted-foreground/80",
                        )}
                    />
                    <button
                        type="button"
                        onClick={onCustomDone}
                        className={cn(
                            "shrink-0 inline-flex items-center justify-center",
                            "h-8 px-3 rounded-md text-[12.5px] font-medium cursor-pointer",
                            "bg-brand text-white hover:bg-brand/90 transition-colors",
                        )}
                    >
                        Done
                    </button>
                </div>
            ) : (
                <>
                    <ul className="max-h-80 overflow-y-auto p-1.5">
                        {PRESET_LOCATIONS.map((opt) => {
                            const active =
                                (opt.kind === "mode" &&
                                    selectedMode === opt.mode) ||
                                (opt.kind === "city" &&
                                    selectedCity === opt.city);
                            const Icon =
                                opt.kind === "mode" && opt.mode === "REMOTE"
                                    ? Home
                                    : opt.kind === "other"
                                      ? Building2
                                      : MapPin;
                            return (
                                <li
                                    key={opt.label}
                                    role="option"
                                    aria-selected={active}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onPick(opt)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-md cursor-pointer",
                                            "text-[13.5px] transition-colors",
                                            active
                                                ? "bg-secondary text-foreground"
                                                : "text-foreground hover:bg-secondary/60",
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="flex-1 truncate">
                                            {opt.label}
                                        </span>
                                        {active && (
                                            <span className="text-[10.5px] uppercase tracking-wider text-brand">
                                                Selected
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {hasSelection && (
                        <button
                            type="button"
                            onClick={onClear}
                            className={cn(
                                "w-full border-t border-border px-4 py-2 text-left cursor-pointer",
                                "text-[12.5px] text-muted-foreground hover:bg-secondary/60",
                            )}
                        >
                            Clear location
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
