"use client";
import { memo, useCallback, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SparklesIcon } from "@/src/components/dashboard/icons";
import {
    PiBookmarkSimpleFill,
    PiBookOpenFill,
    PiBriefcaseFill,
    PiBuildingsFill,
    PiCalendarCheckFill,
    PiChatCircleFill,
    PiCurrencyInrFill,
    PiFileTextFill,
    PiGearFill,
    PiHouseFill,
    PiRocketLaunchFill,
    PiSquaresFourFill,
    PiUserFill,
    PiUsersFill,
} from "react-icons/pi";
import type { UserRole } from "@/src/lib/api";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { selectTotalUnread, useChatStore } from "@/src/store/useChatStore";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { canManageCompany } from "@/src/lib/catalog/companyRoles";
import Image from "next/image";

type IconComp = ComponentType<{ className?: string }>;

type Item = {
    key: string;
    label: string;
    icon: IconComp;
    href: string;
    badge?: string;
    badgeIntent?: "muted" | "primary";
};

type NavSet = { workspace: Item[]; platform?: Item[]; profile: Item[] };

const studentNav: NavSet = {
    workspace: [
        {
            key: "dashboard",
            label: "Dashboard",
            icon: PiHouseFill,
            href: "/home",
        },
        {
            key: "internships",
            label: "Internships",
            icon: PiBriefcaseFill,
            href: "/home/internships",
        },
        {
            key: "applications",
            label: "My Applications",
            icon: PiFileTextFill,
            href: "/home/applications",
        },
        {
            key: "saved",
            label: "Saved",
            icon: PiBookmarkSimpleFill,
            href: "/home/saved",
        },
        {
            key: "messages",
            label: "Messages",
            icon: PiChatCircleFill,
            href: "/home/messages",
        },
        {
            key: "schedules",
            label: "Schedules",
            icon: PiCalendarCheckFill,
            href: "/home/schedules",
        },
    ],
    platform: [
        {
            key: "instructions",
            label: "Instructions",
            icon: PiBookOpenFill,
            href: "/home/instructions",
        },
    ],
    profile: [
        {
            key: "resume",
            label: "Resume",
            icon: PiFileTextFill,
            href: "/home/resume",
        },
        {
            key: "profile",
            label: "Profile",
            icon: PiUserFill,
            href: "/home/profile",
        },
        {
            key: "settings",
            label: "Settings",
            icon: PiGearFill,
            href: "/home/settings",
        },
    ],
};

const employerNav: NavSet = {
    workspace: [
        {
            key: "dashboard",
            label: "Dashboard",
            icon: PiHouseFill,
            href: "/home",
        },
        {
            key: "manage-listings",
            label: "My listings",
            icon: PiBriefcaseFill,
            href: "/home/manage-listings",
        },
        {
            key: "applicants",
            label: "Applicants",
            icon: PiUsersFill,
            href: "/home/applicants",
        },
        {
            key: "messages",
            label: "Messages",
            icon: PiChatCircleFill,
            href: "/home/messages",
        },
        {
            key: "schedules",
            label: "Schedules",
            icon: PiCalendarCheckFill,
            href: "/home/schedules",
        },
    ],
    platform: [
        {
            key: "explore-plans",
            label: "Explore Plans",
            icon: PiRocketLaunchFill,
            href: "/home/explore-plans",
        },
        {
            key: "instructions",
            label: "Instructions",
            icon: PiBookOpenFill,
            href: "/home/instructions",
        },
    ],
    profile: [
        {
            key: "profile",
            label: "Profile",
            icon: PiUserFill,
            href: "/home/profile",
        },
        {
            key: "settings",
            label: "Settings",
            icon: PiGearFill,
            href: "/home/settings",
        },
    ],
};

function pickNav(role: UserRole | null | undefined): NavSet {
    return role === "EMPLOYER" ? employerNav : studentNav;
}

function resolveActiveKey(pathname: string, nav: NavSet): string {
    const segment = pathname.split("/")[2] ?? "";
    const all = [...nav.workspace, ...(nav.platform ?? []), ...nav.profile];
    const match = all.find((it) => it.key === segment);
    // Fall back to the raw segment (e.g. "company") so a section with no
    // workspace entry doesn't spuriously highlight Dashboard; empty path
    // (= /home) still resolves to the dashboard.
    return match?.key ?? (segment || "dashboard");
}

export function Sidebar() {
    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col w-60 shrink-0",
                "sticky top-0 h-screen",
                "border-r border-sidebar-border bg-sidebar",
            )}
        >
            <SidebarBody />
        </aside>
    );
}

// inner sidebar shared by desktop aside and mobile drawer
export function SidebarBody({
    onNavigate,
}: {
    onNavigate?: () => void;
} = {}) {
    const pathname = usePathname() ?? "/home";
    const role = useMeStore((s) => s.me?.role);
    const initialized = useMeStore((s) => s.initialized);
    // Signed-out visitors only ever reach the public internships list, so we
    // render a stripped-down sidebar for them: just the one browsable
    // destination plus a sign-in prompt. We wait for the session store to
    // initialise before deciding, to avoid flashing the logged-out chrome at
    // an authenticated user mid-hydration.
    const loggedOut = useUserSessionStore(
        (s) => s.initialized && !s.session?.user,
    );
    const totalUnread = useChatStore(selectTotalUnread);
    const nav = pickNav(role);
    const resolvedKey = resolveActiveKey(pathname, nav);

    const [pendingKey, setPendingKey] = useState<string | null>(null);
    if (pendingKey !== null && pendingKey === resolvedKey) {
        setPendingKey(null);
    }
    const activeKey = pendingKey ?? resolvedKey;

    const onNavClick = useCallback(
        (key: string) => {
            setPendingKey(key);
            onNavigate?.();
        },
        [onNavigate],
    );

    const decorate = useCallback(
        (item: Item): Item => {
            if (item.key !== "messages" || totalUnread <= 0) return item;
            return {
                ...item,
                badge: totalUnread > 99 ? "99+" : String(totalUnread),
                badgeIntent: "primary",
            };
        },
        [totalUnread],
    );

    return (
        <>
            <Link
                href={loggedOut ? "/" : "/home"}
                onClick={() => onNavigate?.()}
                className="flex items-center gap-2 px-5 h-13 border-b border-border cursor-pointer shrink-0"
            >
                <div className="relative h-7.5 w-7.5 ring-1 ring-black/15 rounded-sm bg-linear-to-b from-neutral-50 to-neutral-100 shadow-sm shadow-black/10 overflow-hidden flex justify-center items-center inset-shadow-xs inset-shadow-black/10">
                    <Image
                        src={"/app-logos/logo.png"}
                        alt="app-logo"
                        className="object-cover pt-0.75 scale-120"
                        fill
                        unoptimized
                    />
                </div>
                <div className="h-7.5 flex flex-col justify-between pt-px">
                    <span className="text-[15px] font-semibold tracking-normal leading-none">
                        SpiderSkill
                    </span>
                    <span className="text-[11px] text-black/50 leading-none">
                        Caffeine to carrier
                    </span>
                </div>
            </Link>

            {loggedOut ? (
                <>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        <SectionLabel>Browse</SectionLabel>
                        <div className="space-y-0.5">
                            <NavItem
                                item={{
                                    key: "internships",
                                    label: "Internships",
                                    icon: PiBriefcaseFill,
                                    href: "/home/internships",
                                }}
                                active={resolvedKey === "internships"}
                                onClick={onNavClick}
                            />
                        </div>
                    </nav>
                    <SignInCard onNavigate={onNavigate} />
                </>
            ) : (
                <>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        <SectionLabel>Workspace</SectionLabel>
                        <div className="space-y-0.5">
                            {!initialized
                                ? Array.from({ length: 6 }).map((_, i) => (
                                      <NavItemSkeleton key={i} />
                                  ))
                                : nav.workspace.map((item) => (
                                      <NavItem
                                          key={item.key}
                                          item={decorate(item)}
                                          active={item.key === activeKey}
                                          onClick={onNavClick}
                                      />
                                  ))}
                        </div>

                        {role === "EMPLOYER" && initialized && (
                            <CompanySection
                                pathname={pathname}
                                onNavigate={onNavigate}
                            />
                        )}

                        {initialized && nav.platform && (
                            <>
                                <SectionLabel className="mt-6">
                                    Platform
                                </SectionLabel>
                                <div className="space-y-0.5">
                                    {nav.platform.map((item) => (
                                        <NavItem
                                            key={item.key}
                                            item={decorate(item)}
                                            active={item.key === activeKey}
                                            onClick={onNavClick}
                                        />
                                    ))}
                                    {role === "EMPLOYER" && (
                                        <OfferLetterLink
                                            onNavigate={onNavigate}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        <SectionLabel className="mt-6">Profile</SectionLabel>
                        <div className="space-y-0.5">
                            {!initialized
                                ? Array.from({ length: 3 }).map((_, i) => (
                                      <NavItemSkeleton key={i} />
                                  ))
                                : nav.profile.map((item) => (
                                      <NavItem
                                          key={item.key}
                                          item={decorate(item)}
                                          active={item.key === activeKey}
                                          onClick={onNavClick}
                                      />
                                  ))}
                        </div>
                    </nav>
                </>
            )}
        </>
    );
}

function NavItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-2 py-1.5 animate-pulse">
            <span className="h-4 w-4 rounded-sm bg-secondary shrink-0" />
            <span className="h-2.5 w-24 rounded-full bg-secondary" />
        </div>
    );
}

function SectionLabel({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                className,
            )}
        >
            {children}
        </div>
    );
}

const NavItem = memo(function NavItem({
    item,
    active,
    onClick,
}: {
    item: Item;
    active: boolean;
    onClick: (key: string) => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            prefetch
            onClick={() => onClick(item.key)}
            className={cn(
                "flex items-center gap-3 rounded-sm px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                active
                    ? "bg-neutral-100 ring-1 ring-black/9 shadow-sm shadow-black/4"
                    : "text-muted-foreground hover:text-foreground/80",
            )}
        >
            <Icon
                className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-orange-500" : "text-neutral-500",
                )}
            />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span
                    className={cn(
                        "min-w-4 h-4 inline-flex items-center justify-center px-1.5 text-[8.5px] font-semibold tabular-nums",
                        item.badgeIntent === "primary"
                            ? "rounded-full bg-orange-500 text-white"
                            : "rounded-md bg-muted text-muted-foreground",
                    )}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
});

// Reference offer-letter template — lives in a Google Doc, opened in a new
// tab rather than an in-app route. Surfaced under the Platform section for
// employers (see OfferLetterLink below).
const OFFER_LETTER_TEMPLATE_URL =
    "https://docs.google.com/document/d/10f7rp7IKgqtXVNagux3H5nVVmMnVJ22wPn03mcF2sZE/edit?tab=t.0";

// "Company" section under the employer workspace nav. Always-expanded group
// of company destinations. The Dashboard link is owner-only (founder /
// co-founder) — everyone else sees the other three. Company role + id come
// from the caller's first membership, mirroring /home/company.
const COMPANY_LINKS: ReadonlyArray<{
    sub: string;
    label: string;
    icon: IconComp;
    adminOnly?: boolean;
    // Custom internal href — overrides the default /home/company/:sub path.
    href?: string;
}> = [
    {
        sub: "dashboard",
        label: "Dashboard",
        icon: PiSquaresFourFill,
        adminOnly: true,
    },
    { sub: "profile", label: "Company Profile", icon: PiBuildingsFill },
    { sub: "listings", label: "Listings", icon: PiBriefcaseFill },
    { sub: "members", label: "Members", icon: PiUsersFill },
    {
        sub: "plans",
        label: "My Plans",
        icon: PiCurrencyInrFill,
        href: "/home/plans",
    },
];

// External "Offer Letter template" link, rendered in the Platform section for
// employers. Opens the reference Google Doc in a new tab.
function OfferLetterLink({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <a
            href={OFFER_LETTER_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground/80 transition-colors"
        >
            <PiFileTextFill className="h-4 w-4 shrink-0 text-neutral-500" />
            <span className="flex-1">Offer Letter template</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
    );
}

function CompanySection({
    pathname,
    onNavigate,
}: {
    pathname: string;
    onNavigate?: () => void;
}) {
    const { memberships, loading } = useMyEmployer();
    const role = memberships[0]?.role ?? null;
    // No company yet — hide the section entirely (the employer-setup flow
    // owns that empty state, not the sidebar).
    if (loading && memberships.length === 0) {
        return (
            <>
                <SectionLabel className="mt-6">Company</SectionLabel>
                <div className="space-y-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <NavItemSkeleton key={i} />
                    ))}
                </div>
            </>
        );
    }
    if (!role) return null;
    const canAdmin = canManageCompany(role);
    const activeSub = pathname.split("/")[3] ?? "";
    const links = COMPANY_LINKS.filter((l) => !l.adminOnly || canAdmin);

    return (
        <>
            <SectionLabel className="mt-6">Company</SectionLabel>
            <div className="space-y-0.5">
                {links.map((l) => {
                    const Icon = l.icon;
                    // Items with a custom href are active when pathname matches
                    // that href; others use the /home/company/:sub sub-segment.
                    const active = l.href
                        ? pathname === l.href ||
                          pathname.startsWith(l.href + "/")
                        : activeSub === l.sub;
                    const dest = l.href ?? `/home/company/${l.sub}`;

                    return (
                        <Link
                            key={l.sub}
                            href={dest}
                            prefetch
                            onClick={() => onNavigate?.()}
                            className={cn(
                                "flex items-center gap-3 rounded-sm px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                                active
                                    ? "bg-neutral-100 ring-1 ring-black/9 shadow-sm shadow-black/4"
                                    : "text-muted-foreground hover:text-foreground/80",
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4 shrink-0",
                                    active
                                        ? "text-orange-500"
                                        : "text-neutral-500",
                                )}
                            />
                            <span className="flex-1">{l.label}</span>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}

// Sign-in prompt shown in place of the profile nav + upgrade card for
// signed-out visitors browsing the public internships list.
function SignInCard({ onNavigate }: { onNavigate?: () => void }) {
    const openDialog = useAuthDialog((s) => s.openDialog);

    return (
        <div className="rounded-lg border border-orange-200 bg-brand-soft p-3 m-2">
            <div className="flex items-center gap-2 text-[12px] font-medium">
                <SparklesIcon className="text-orange-600 h-3.5 w-3.5" />
                <span>Join SpiderSkill</span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                Sign in to apply to internships, save listings, and message
                founders.
            </p>
            <button
                type="button"
                onClick={() => {
                    onNavigate?.();
                    openDialog("/home/internships");
                }}
                className={cn(
                    "mt-3 inline-flex w-full items-center justify-center h-8 rounded-md cursor-pointer",
                    "bg-neutral-900 text-[12px] font-medium text-white",
                    "inset-shadow-xs inset-shadow-white/40 shadow-xs shadow-black/10",
                )}
            >
                Sign in
            </button>
        </div>
    );
}
