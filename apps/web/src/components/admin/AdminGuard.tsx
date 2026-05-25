"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// gates admin content with a skeleton during hydration
export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const sessionInitialized = useUserSessionStore((s) => s.initialized);
    const me = useMeStore((s) => s.me);
    const meLoading = useMeStore((s) => s.loading);
    const meInitialized = useMeStore((s) => s.initialized);

    useEffect(() => {
        if (!sessionInitialized) return;
        if (!session?.user) {
            router.replace("/");
            return;
        }
        if (!meInitialized || meLoading) return;
        if (!me?.isAdmin) router.replace("/home/dashboard");
    }, [
        sessionInitialized,
        session?.user,
        meInitialized,
        meLoading,
        me?.isAdmin,
        router,
    ]);

    if (!sessionInitialized) return <ContentSkeleton />;
    if (!session?.user) return null;
    if (!meInitialized || meLoading) return <ContentSkeleton />;
    if (!me?.isAdmin) return null;

    return <>{children}</>;
}

function ContentSkeleton() {
    return (
        <section className="px-6 py-6 space-y-4 animate-pulse">
            <div className="space-y-2">
                <div className="h-5 w-48 rounded-md bg-secondary" />
                <div className="h-3 w-96 max-w-full rounded-md bg-secondary/60" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="h-9 w-64 rounded-lg bg-secondary" />
                <div className="h-9 flex-1 sm:max-w-md rounded-lg bg-secondary" />
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="h-11 px-5 border-b border-border" />
                <ul className="divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <li
                            key={i}
                            className="flex items-center gap-3 px-5 py-3.5"
                        >
                            <div className="h-9 w-9 rounded-md bg-secondary shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-1/3 rounded-full bg-secondary" />
                                <div className="h-2.5 w-1/2 rounded-full bg-secondary/70" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
