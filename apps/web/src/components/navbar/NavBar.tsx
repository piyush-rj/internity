"use client";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, BrandMark } from "@/src/components/base/icons";
import { UserMenu } from "@/src/components/navbar/UserMenu";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { signIn } from "next-auth/react";
import { ChevronRight } from "../base/HeroComponents/glyphs";
import Link from "next/link";

export function NavBar() {
    const session = useUserSessionStore((s) => s.session);

    function handleSignin() {
        signIn("google", { callbackUrl: "/" });
    }

    const items = [
        "Internships",
        "Jobs",
        "Courses",
        "Placement Guarantee",
        "For employers",
    ];
    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background border-x border-b border-border">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                <div className="flex items-center gap-8 justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-foreground"
                    >
                        <span className="text-[16px] font-semibold tracking-tight">
                            internity
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
                        <UserMenu />
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
