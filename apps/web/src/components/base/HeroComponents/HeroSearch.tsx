"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Briefcase,
    Building2,
    ChevronDown,
    Search,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
    listingApi,
    type JobTitle,
    type ListingWithCompany,
} from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

// Landing-page search. Anyone (signed-in or out) can type and see live
// suggestions from the public /listing endpoint. Auth is only required at
// the moment of navigation: signed-out visitors get the auth dialog with the
// destination encoded as the post-sign-in next-path; signed-in users go
// straight there.

// Roles pickable in the dropdown: the predefined titles plus "Other", which
// maps to the CUSTOM catch-all so visitors can browse custom-titled listings.
type RoleValue = JobTitle;

const ROLE_OPTIONS: ReadonlyArray<{ value: RoleValue; label: string }> = [
    ...JOB_TITLES,
    { value: "CUSTOM", label: "Other" },
];

export function HeroSearch() {
    const router = useRouter();
    const openDialog = useAuthDialog((s) => s.openDialog);
    const signedIn = useUserSessionStore((s) => !!s.session?.user?.id);

    const [query, setQuery] = useState("");
    // A predefined role is filtered server-side via the jobTitle enum. The
    // "Other" branch instead lets the visitor type a free-form role, which we
    // fold into the text query (`q`) since there's no enum value for it.
    const [jobTitle, setJobTitle] = useState<Exclude<
        RoleValue,
        "CUSTOM"
    > | null>(null);
    const [customRole, setCustomRole] = useState("");
    const [roleOtherMode, setRoleOtherMode] = useState(false);

    const [suggestions, setSuggestions] = useState<ListingWithCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [roleOpen, setRoleOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();
    const roleListId = useId();

    // The main search box and a free-form "Other" role both feed the `q`
    // text search; combine them so either (or both) narrows the results.
    const effectiveQ = [query.trim(), customRole.trim()]
        .filter(Boolean)
        .join(" ");

    // Debounced fetch of search suggestions whenever the query or role
    // changes.
    useEffect(() => {
        if (effectiveQ.length < 2 && !jobTitle) {
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
                    q: effectiveQ || undefined,
                    jobTitle: jobTitle || undefined,
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
    }, [effectiveQ, jobTitle]);

    // Autofocus the free-form role input when "Other" is picked.
    useEffect(() => {
        if (roleOtherMode) customInputRef.current?.focus();
    }, [roleOtherMode]);

    // Close any open popover on outside click or Escape.
    useEffect(() => {
        if (!suggestOpen && !roleOpen) return;
        function onDown(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setSuggestOpen(false);
                setRoleOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setSuggestOpen(false);
                setRoleOpen(false);
            }
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [suggestOpen, roleOpen]);

    function buildListPath(): string {
        const params = new URLSearchParams();
        if (effectiveQ) params.set("q", effectiveQ);
        if (jobTitle) params.set("jobTitle", jobTitle);
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

    function pickRole(value: RoleValue) {
        if (value === "CUSTOM") {
            // "Other" → swap the panel for a free-form input instead of
            // selecting an enum value.
            setJobTitle(null);
            setRoleOtherMode(true);
            return;
        }
        setJobTitle(value);
        setCustomRole("");
        setRoleOtherMode(false);
        setRoleOpen(false);
        // Surface the matching jobs (or a no-results state) for the picked
        // role right away, without needing to focus the text input.
        setSuggestOpen(true);
    }

    function clearRole() {
        setJobTitle(null);
        setCustomRole("");
        setRoleOtherMode(false);
    }

    const hasRole = !!jobTitle || customRole.trim().length > 0;

    const showSuggestPanel =
        suggestOpen &&
        (loading ||
            suggestions.length > 0 ||
            effectiveQ.length >= 2 ||
            !!jobTitle);

    const roleLabel = customRole.trim()
        ? customRole.trim()
        : (ROLE_OPTIONS.find((t) => t.value === jobTitle)?.label ?? "Role");

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
                            setRoleOpen(false);
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

                <div aria-hidden className="w-px self-stretch bg-border my-2" />

                {/* Role dropdown trigger */}
                <div className="relative flex items-stretch shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setRoleOpen((o) => !o);
                            setSuggestOpen(false);
                        }}
                        aria-haspopup="listbox"
                        aria-expanded={roleOpen}
                        aria-controls={roleListId}
                        aria-label={
                            hasRole ? `Role: ${roleLabel}` : "Choose role"
                        }
                        className={cn(
                            "inline-flex items-center gap-1 sm:gap-2",
                            "px-2 sm:px-3 text-[13px] sm:text-[14px] font-medium",
                            "max-w-28 sm:max-w-none",
                            "text-foreground hover:bg-secondary/60",
                            "transition-colors cursor-pointer rounded-none",
                        )}
                    >
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        {/* On mobile only show the label when a value has
                            been picked — empty state stays a compact icon +
                            chevron. */}
                        <span
                            className={cn(
                                "truncate",
                                !hasRole && "hidden sm:inline",
                                !hasRole && "text-muted-foreground/80",
                            )}
                        >
                            {roleLabel}
                        </span>
                        <ChevronDown
                            className={cn(
                                "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform",
                                roleOpen && "rotate-180",
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

                {roleOpen && (
                    <RolePanel
                        id={roleListId}
                        selected={jobTitle}
                        otherMode={roleOtherMode}
                        customValue={customRole}
                        onCustomChange={setCustomRole}
                        customInputRef={customInputRef}
                        onPick={pickRole}
                        onClear={clearRole}
                        onCustomDone={() => {
                            setRoleOpen(false);
                            setRoleOtherMode(false);
                            setSuggestOpen(true);
                        }}
                    />
                )}
            </form>
            <Button
                // The internships list is public, so this goes straight there
                // for everyone — signed-in users land in the dashboard view,
                // signed-out visitors get the public read-only list. No auth
                // dialog either way (unlike `navigate`, which gates on auth).
                onClick={() => router.push("/home/internships")}
                variant={"exec-dark"}
                className={cn(
                    "shrink-0 inline-flex items-center justify-center gap-2 rounded-lg",
                    "text-white px-4 h-11 sm:h-11.5 text-[14px] font-medium cursor-pointer",
                )}
            >
                Explore Internships
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

function RolePanel({
    id,
    selected,
    otherMode,
    customValue,
    onCustomChange,
    customInputRef,
    onPick,
    onClear,
    onCustomDone,
}: {
    id: string;
    selected: Exclude<RoleValue, "CUSTOM"> | null;
    otherMode: boolean;
    customValue: string;
    onCustomChange: (v: string) => void;
    customInputRef: React.RefObject<HTMLInputElement | null>;
    onPick: (value: RoleValue) => void;
    onClear: () => void;
    onCustomDone: () => void;
}) {
    const hasSelection = !!selected || customValue.trim().length > 0;
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
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
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
                        placeholder="Type a role"
                        aria-label="Type a role"
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
                        {ROLE_OPTIONS.map((opt) => {
                            const active = selected === opt.value;
                            return (
                                <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={active}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onPick(opt.value)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-md cursor-pointer",
                                            "text-[13.5px] transition-colors",
                                            active
                                                ? "bg-secondary text-foreground"
                                                : "text-foreground hover:bg-secondary/60",
                                        )}
                                    >
                                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                            Clear role
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
