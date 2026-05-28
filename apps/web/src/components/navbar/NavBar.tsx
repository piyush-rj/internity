"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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

    function handleSignin() {
        openDialog("/home/dashboard");
    }

    const items = [
        "Internships",
        "Courses",
        "Placement Guarantee",
        "For employers",
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
                    "mx-auto flex items-center justify-between px-4 border",
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    scrolled
                        ? "mt-1.5 h-14 max-w-270 rounded-lg border-neutral-300/80 bg-card shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)]"
                        : "h-full max-w-6xl rounded-none border-transparent bg-transparent shadow-none",
                )}
            >
                <div className="flex items-center gap-8 justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-foreground"
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
                        <span className="text-[16px] font-semibold tracking-tight">
                            SpiderSkill
                        </span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-7">
                    {items.map((item) => (
                        <Link
                            key={item}
                            href="#"
                            className="text-[13px] text-neutral-700 hover:text-black transition-colors duration-200"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
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
                </div>
            </div>
        </header>
    );
}
