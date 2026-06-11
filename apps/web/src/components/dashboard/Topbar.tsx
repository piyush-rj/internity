"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { PlusIcon, SearchIcon } from "@/src/components/dashboard/icons";
import { NotificationPanel } from "@/src/components/dashboard/NotificationPanel";
import { MobileNavDrawer } from "@/src/components/dashboard/MobileNavDrawer";
import { SidebarBody } from "@/src/components/dashboard/Sidebar";
import { useListingSearch } from "@/src/hooks/useListingSearch";
import { cn } from "@/src/lib/utils";
import { ChevronRight } from "../base/HeroComponents/glyphs";
import { UserMenu } from "@/src/components/navbar/UserMenu";
import { ProfileCompletionPill } from "@/src/components/navbar/ProfileCompletionPill";
import { useBreadcrumbOverride } from "@/src/components/dashboard/BreadcrumbContext";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";

type Crumb = {
    label: string;
    href: string;
};

const FROM_LABEL: Record<string, { label: string; href: string }> = {
    internships: { label: "Internships", href: "/home/internships" },
    saved: { label: "Saved", href: "/home/saved" },
};

// builds breadcrumbs from the url
function buildCrumbs(pathname: string, from?: string | null): Crumb[] {
    const segments = pathname
        .replace(/^\/home\/?/, "")
        .split("/")
        .filter(Boolean);

    const crumbs: Crumb[] = [{ label: "Home", href: "/home/dashboard" }];

    if (segments.length === 0 || segments[0] === "dashboard") {
        return crumbs;
    }

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!;
        const href = "/home/" + segments.slice(0, i + 1).join("/");
        if (seg === "listings" && from && FROM_LABEL[from]) {
            crumbs.push(FROM_LABEL[from]!);
        } else {
            crumbs.push({ label: prettify(seg), href });
        }
    }
    return crumbs;
}

function prettify(segment: string): string {
    return segment
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function Topbar() {
    const router = useRouter();
    const pathname = usePathname() ?? "/home/dashboard";
    const searchParams = useSearchParams();
    const crumbOverride = useBreadcrumbOverride();
    const crumbs = buildCrumbs(pathname, searchParams?.get("from"));
    if (crumbOverride && crumbs.length > 1) {
        crumbs[crumbs.length - 1]!.label = crumbOverride;
    }
    const role = useMeStore((s) => s.me?.role);
    // Signed-out visitors can only reach the public internships list. Wait for
    // the session store to initialise before swapping in the logged-out
    // controls so we don't flash them at an authenticated user mid-hydration.
    const loggedOut = useUserSessionStore(
        (s) => s.initialized && !s.session?.user,
    );
    const openAuthDialog = useAuthDialog((s) => s.openDialog);
    const [search, setSearch] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { items: suggestions, loading: searching } = useListingSearch(search);
    const [isMac, setIsMac] = useState<boolean>(false);

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
        }
    }, []);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
                setOpen(true);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);

        setSearch("");
    }, [pathname]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const q = search.trim();
        setOpen(false);
        router.push(
            `/home/internships${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        );
    }

    const showDropdown =
        open &&
        search.trim().length >= 2 &&
        (searching || suggestions.length > 0);

    const { listingQuota } = useMyEmployer();
    const showQuotaDial = role === "EMPLOYER" && listingQuota !== null;

    const primaryCta =
        role === "EMPLOYER"
            ? { label: "Post an internship", href: "/home/manage-listings/new" }
            : null;

    return (
        <header className="h-13 border-b border-border nav-blur sticky top-0 z-30 bg-card">
            <div className="h-full flex items-center justify-between gap-4 px-4 sm:px-6">
                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open menu"
                    className={cn(
                        "lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center shrink-0",
                        "rounded-md text-muted-foreground",
                        "hover:bg-secondary hover:text-foreground transition-colors",
                    )}
                >
                    <Menu className="h-4 w-4" />
                </button>
                <nav
                    aria-label="Breadcrumb"
                    className="hidden md:flex items-center gap-2 min-w-0"
                >
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className={cn(
                            "hidden sm:inline-flex h-7 w-7 items-center justify-center shrink-0",
                            "rounded-md text-muted-foreground",
                            "hover:bg-secondary hover:text-foreground transition-colors",
                        )}
                    >
                        <ArrowLeft className="size-3.5" />
                    </button>
                    <ol className="flex items-center gap-1.5 min-w-0 -ml-2">
                        {crumbs.map((crumb, i) => {
                            const isLast = i === crumbs.length - 1;
                            return (
                                <li
                                    key={crumb.href + i}
                                    className="flex items-center gap-1.5 min-w-0"
                                >
                                    {isLast ? (
                                        <span className="text-[13px] font-medium text-foreground truncate">
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors truncate"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                    {!isLast && (
                                        <ChevronRight
                                            className="size-2.5 text-muted-foreground"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>

                {/* The role/company/skill search is a student concern — hide
                    it for employers, who manage listings instead. */}
                {role !== "EMPLOYER" && (
                    <div
                        ref={wrapperRef}
                        className="hidden md:block relative max-w-md w-full mr-2"
                    >
                        <form onSubmit={handleSearch}>
                            <div
                                className={cn(
                                    "flex w-full items-center gap-2 h-9 px-3",
                                    "rounded-full border border-input bg-card",
                                    "text-[13px]",
                                    "bg-neutral-50",
                                )}
                            >
                                <SearchIcon className="text-muted-foreground h-4 w-4" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setOpen(true);
                                    }}
                                    onFocus={() => setOpen(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setOpen(false);
                                            inputRef.current?.blur();
                                        }
                                    }}
                                    placeholder="Search role, company, or skill…"
                                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                                />
                                <kbd
                                    aria-hidden
                                    className={cn(
                                        "inline-flex items-center gap-1 h-5 px-1.5 rounded",
                                        "border border-border bg-secondary/60",
                                        "text-[10px] font-medium text-muted-foreground",
                                        "select-none",
                                    )}
                                >
                                    <span className="text-[13px]">
                                        {isMac ? "⌘" : "Ctrl"}
                                    </span>
                                    +<span>K</span>
                                </kbd>
                            </div>
                        </form>

                        {showDropdown && (
                            <div
                                className={cn(
                                    "absolute left-0 right-0 top-[calc(100%+6px)] z-40",
                                    "rounded-lg border border-border bg-card shadow-lg overflow-hidden",
                                )}
                            >
                                {searching && suggestions.length === 0 ? (
                                    <div className="px-4 py-3 text-[12px] text-muted-foreground">
                                        Searching…
                                    </div>
                                ) : (
                                    <ul className="max-h-80 overflow-y-auto divide-y divide-border">
                                        {suggestions.map((s) => (
                                            <li key={s.id}>
                                                <Link
                                                    href={`/home/listings/${s.id}`}
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors"
                                                >
                                                    <SuggestionAvatar
                                                        name={s.company.name}
                                                        logoUrl={
                                                            s.company.logoUrl
                                                        }
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[13px] font-medium text-foreground truncate">
                                                            {s.title}
                                                        </div>
                                                        <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                                                            {s.company.name}
                                                            {s.city
                                                                ? ` · ${s.city}`
                                                                : ""}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => handleSearch(e)}
                                    className={cn(
                                        "w-full px-3 py-2 text-left text-[12px] font-medium text-foreground",
                                        "border-t border-border bg-secondary/40 hover:bg-secondary",
                                        "transition-colors cursor-pointer",
                                    )}
                                >
                                    See all results for “{search.trim()}”
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {loggedOut ? (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => openAuthDialog("/home/internships")}
                            className={cn(
                                "inline-flex items-center h-8.5 px-3 rounded-md cursor-pointer",
                                "text-[12.5px] font-medium text-foreground",
                                "hover:bg-secondary transition-colors",
                            )}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={() => openAuthDialog("/home/internships")}
                            className={cn(
                                "inline-flex items-center h-8.5 px-3 rounded-md cursor-pointer",
                                "bg-neutral-900 text-[12.5px] font-medium text-white",
                                "transition-colors",
                                "inset-shadow-xs inset-shadow-white/50 shadow-xs shadow-black/10",
                            )}
                        >
                            Sign up
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        {showQuotaDial && (
                            <div className="hidden sm:flex items-center mr-1">
                                <TopbarQuotaDial
                                    remaining={listingQuota!.remaining}
                                    total={listingQuota!.total}
                                />
                            </div>
                        )}
                        {primaryCta && (
                            <Link
                                href={primaryCta.href}
                                aria-label={primaryCta.label}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-1.5 h-8.5 px-2.5",
                                    "rounded-md bg-neutral-900",
                                    "text-[12px] font-medium text-white",
                                    "transition-colors",
                                    "inset-shadow-xs inset-shadow-white/50 shadow-xs shadow-black/10",
                                )}
                            >
                                <PlusIcon className="size-3.5" />
                                {primaryCta.label}
                            </Link>
                        )}
                        <ProfileCompletionPill />
                        <NotificationPanel />
                        <div className="ml-1">
                            <UserMenu />
                        </div>
                    </div>
                )}
            </div>
            <MobileNavDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <SidebarBody onNavigate={() => setDrawerOpen(false)} />
            </MobileNavDrawer>
        </header>
    );
}

function SuggestionAvatar({
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
                className="h-7 w-7 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[11px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function TopbarQuotaDial({
    remaining,
    total,
}: {
    remaining: number | null;
    total: number | null;
}) {
    const unlimited = remaining === null || total === null;
    const r = 13;
    const stroke = 3;
    const size = (r + stroke) * 2;
    const circ = 2 * Math.PI * r;
    const progress = unlimited
        ? 1
        : total > 0
          ? Math.min(1, Math.max(0, remaining / total))
          : 0;
    const offset = circ * (1 - progress);
    const color = unlimited
        ? "#22c55e"
        : remaining === 0
          ? "#ef4444"
          : remaining <= total! * 0.3
            ? "#f97316"
            : "#22c55e";
    const tooltip = unlimited
        ? "Unlimited listings available"
        : remaining === 1
          ? "1 listing slot remaining"
          : remaining === 0
            ? "No listing slots remaining"
            : `${remaining} listing slots remaining`;

    return (
        <div
            className="group relative flex items-center justify-center cursor-default"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                style={{ transform: "rotate(-90deg)" }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span
                className="absolute font-bold tabular-nums"
                style={{ color, lineHeight: 1, fontSize: unlimited ? 11 : 8 }}
            >
                {unlimited ? "∞" : `${remaining}/${total}`}
            </span>
            <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="relative whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-neutral-900" />
                    {tooltip}
                </div>
            </div>
        </div>
    );
}
