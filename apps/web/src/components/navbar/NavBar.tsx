"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { UserMenu } from "@/src/components/navbar/UserMenu";
import { ProfileCompletionPill } from "@/src/components/navbar/ProfileCompletionPill";
import { EmployerVerificationPill } from "@/src/components/navbar/EmployerVerificationPill";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { useMeStore } from "@/src/store/useMeStore";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { ChevronRight } from "../base/HeroComponents/glyphs";
import { cn } from "@/src/lib/utils";
import Image from "next/image";

export function NavBar({
    floatOnScroll = false,
    className,
}: {
    floatOnScroll?: boolean;
    className?: string;
}) {
    const session = useUserSessionStore((s) => s.session);
    const openDialog = useAuthDialog((s) => s.openDialog);
    const role = useMeStore((s) => s.me?.role ?? null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { listingQuota } = useMyEmployer();
    const showDial = role === "EMPLOYER" && listingQuota !== null;

    useEffect(() => {
        if (!floatOnScroll) return;
        let ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                setScrolled(window.scrollY > 16);
                ticking = false;
            });
        }
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [floatOnScroll]);

    // Close mobile menu on Escape, and lock body scroll while it is open.
    useEffect(() => {
        if (!mobileOpen) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setMobileOpen(false);
        }
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);

    function handleSignin() {
        openDialog("/home/dashboard");
        setMobileOpen(false);
    }

    const items: { label: string; href: string }[] = [
        { label: "Internships", href: "/home/internships" },
        { label: "Interview questions", href: "/interview-questions" },
        { label: "Student FAQ's", href: "/faq" },
        { label: "For Employers", href: "/for-employers" },
    ];
    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 h-14",
                "border-b",
                "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                scrolled
                    ? "border-b-transparent bg-transparent sm:left-0 sm:right-0 left-2 right-2"
                    : `border-b-border bg-neutral-50 ${className}`,
            )}
        >
            <div
                className={cn(
                    "mx-auto flex items-center justify-between px-3 sm:px-4 border",
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    scrolled
                        ? "mt-1.5 h-14 max-w-270 rounded-lg border-neutral-300/80 bg-card shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)]"
                        : "h-full max-w-6xl rounded-none border-transparent bg-transparent shadow-none",
                )}
            >
                <div className="flex items-center gap-8 justify-between min-w-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-foreground min-w-0"
                    >
                        <div className="relative h-7.5 w-7.5 shrink-0 ring-1 ring-black/15 rounded-sm bg-linear-to-b from-neutral-50 to-neutral-100 shadow-sm shadow-black/10 overflow-hidden flex justify-center items-center inset-shadow-xs inset-shadow-black/10">
                            <Image
                                src={"/app-logos/logo.png"}
                                alt="app-logo"
                                className="object-cover pt-0.75 scale-120"
                                fill
                                unoptimized
                            />
                        </div>
                        <span className="text-[15px] sm:text-[16px] font-semibold tracking-tight truncate">
                            SpiderSkill
                        </span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-7">
                    {items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-[13px] text-neutral-700 hover:text-black transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {session?.user ? (
                        <>
                            <ProfileCompletionPill />
                            <EmployerVerificationPill />
                            {showDial && (
                                <div className="hidden md:flex items-center">
                                    <ListingQuotaDial remaining={listingQuota!.remaining} total={listingQuota!.total} />
                                </div>
                            )}
                            {role === "EMPLOYER" && (
                                <Link
                                    href="/home/manage-listings/new"
                                    className={cn(
                                        "hidden md:inline-flex items-center gap-2 h-8.5 pl-1 pr-3.5 rounded-full",
                                        "bg-orange-50 border border-orange-200 text-orange-500",
                                        "text-[13px] font-medium hover:bg-orange-100 transition-colors",
                                    )}
                                >
                                    <PostInternshipIcon />
                                    Post an internship
                                </Link>
                            )}
                            <UserMenu />
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleSignin}
                                className={cn(
                                    "hidden md:inline-flex items-center gap-2 h-8.5 pl-1 pr-3.5 rounded-full",
                                    "bg-orange-50 border border-orange-200 text-orange-500",
                                    "text-[13px] font-medium hover:bg-orange-100 transition-colors cursor-pointer",
                                )}
                            >
                                <PostInternshipIcon />
                                Post an internship
                            </button>
                            <Button
                                variant={"exec-dark"}
                                onClick={handleSignin}
                                className="inline-flex items-center text-[13px] h-8.5 px-3! cursor-pointer"
                            >
                                Sign in
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                    <button
                        type="button"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((o) => !o)}
                        className={cn(
                            "md:hidden inline-flex h-9 w-9 items-center justify-center",
                            "rounded-md border border-border bg-card text-foreground cursor-pointer",
                            "hover:bg-secondary transition-colors",
                        )}
                    >
                        {mobileOpen ? (
                            <X className="h-4.5 w-4.5" />
                        ) : (
                            <Menu className="h-4.5 w-4.5" />
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40"
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    />
                    <nav
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "relative mx-3 mt-2 rounded-lg border border-border bg-card",
                            "shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)]",
                            "p-2",
                        )}
                    >
                        {items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "block rounded-md px-3 py-2.5 text-[14px] font-medium",
                                    "text-foreground hover:bg-secondary transition-colors",
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="mt-1 pt-1 border-t border-border">
                            {session?.user && role === "EMPLOYER" ? (
                                <Link
                                    href="/home/manage-listings/new"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-[14px] font-medium text-orange-500 hover:bg-orange-50 transition-colors"
                                >
                                    <Briefcase className="h-4 w-4" />
                                    Post an internship
                                </Link>
                            ) : !session?.user ? (
                                <button
                                    type="button"
                                    onClick={handleSignin}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-[14px] font-medium text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
                                >
                                    <Briefcase className="h-4 w-4" />
                                    Post an internship
                                </button>
                            ) : null}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

function ListingQuotaDial({ remaining, total }: { remaining: number | null; total: number | null }) {
    const unlimited = remaining === null || total === null;
    const r = 13;
    const stroke = 3;
    const size = (r + stroke) * 2;
    const circ = 2 * Math.PI * r;
    const progress = unlimited ? 1 : total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
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
        <div className="group relative flex items-center justify-center cursor-default" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color} strokeWidth={stroke}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute font-bold tabular-nums" style={{ color, lineHeight: 1, fontSize: unlimited ? 11 : 8 }}>
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

function PostInternshipIcon() {
    return (
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-50" />
            <Briefcase className="relative h-3.5 w-3.5 text-white" />
        </span>
    );
}
