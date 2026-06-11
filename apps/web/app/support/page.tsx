"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, LogOut } from "lucide-react";
import { SupportConsole } from "@/src/components/chat/SupportConsole";
import { WebSocketProvider } from "@/src/lib/socket/WebSocketProvider";
import { useMeStore } from "@/src/store/useMeStore";
import { clearSupportToken, getSupportToken } from "@/src/lib/supportAuth";

export default function SupportPage() {
    const router = useRouter();
    const me = useMeStore((s) => s.me);
    const meLoading = useMeStore((s) => s.loading);
    const meInitialized = useMeStore((s) => s.initialized);
    const bootstrapped = useRef(false);
    // The token lives in localStorage, which is unavailable during SSR. Gate
    // the first paint on this flag so the server and the initial client render
    // produce identical markup (the skeleton), avoiding a hydration mismatch.
    const [mounted, setMounted] = useState(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);

    // No support token → bounce to the login page.
    useEffect(() => {
        if (!mounted) return;
        if (!getSupportToken()) {
            router.replace("/support/login");
            return;
        }
        // Force a fresh /auth/me with the support token (the regular
        // MeBootstrap only runs for Supabase sessions).
        if (!bootstrapped.current) {
            bootstrapped.current = true;
            useMeStore.getState().refetch();
        }
    }, [router, mounted]);

    // The token resolved to a non-admin (e.g. stale token) — sign out.
    useEffect(() => {
        if (meInitialized && !meLoading && me && !me.isAdmin) {
            clearSupportToken();
            useMeStore.getState().reset();
            router.replace("/support/login");
        }
    }, [meInitialized, meLoading, me, router]);

    function logout() {
        clearSupportToken();
        useMeStore.getState().reset();
        router.replace("/support/login");
    }

    if (!mounted) return <ConsoleSkeleton />;
    if (!getSupportToken()) return null;
    if (!meInitialized || meLoading || !me) return <ConsoleSkeleton />;
    if (!me.isAdmin) return null;

    return (
        <div className="flex flex-col h-screen min-h-0 bg-neutral-50">
            <header className="h-13 shrink-0 flex items-center justify-between px-4 border-b border-border bg-white">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center">
                        <LifeBuoy className="h-4 w-4" />
                    </div>
                    <span className="text-[14px] font-semibold tracking-tight">
                        Support Console
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[12.5px] text-muted-foreground hidden sm:inline">
                        {me.name ?? me.email ?? "Support agent"}
                    </span>
                    <button
                        type="button"
                        onClick={logout}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium bg-secondary/60 hover:bg-secondary transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0">
                <WebSocketProvider>
                    <SupportConsole basePath="/support" />
                </WebSocketProvider>
            </div>
        </div>
    );
}

function ConsoleSkeleton() {
    return (
        <div className="flex flex-col h-screen bg-neutral-50">
            <div className="h-13 shrink-0 border-b border-border bg-white" />
            <div className="flex-1 flex">
                <div className="w-80 border-r border-border bg-white p-3 space-y-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-14 w-full rounded-md bg-secondary/60 animate-pulse"
                        />
                    ))}
                </div>
                <div className="flex-1" />
            </div>
        </div>
    );
}
