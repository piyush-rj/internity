"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { UserMenu } from "@/src/components/navbar/UserMenu";
import { ProfileCompletionPill } from "@/src/components/navbar/ProfileCompletionPill";
import { EmployerVerificationPill } from "@/src/components/navbar/EmployerVerificationPill";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { useAuthDialog } from "@/src/store/useAuthDialog";
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
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
                            <UserMenu />
                        </>
                    ) : (
                        <Button
                            variant={"exec-dark"}
                            onClick={handleSignin}
                            className="inline-flex items-center text-[13px] h-8.5 px-3! cursor-pointer"
                        >
                            Sign in
                            <ChevronRight className="h-3 w-3" />
                        </Button>
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
                    </nav>
                </div>
            )}
        </header>
    );
}
