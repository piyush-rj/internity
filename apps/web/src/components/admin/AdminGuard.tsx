"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

/**
 * Redirects non-admins away from /admin. Admin status is server-computed
 * (`MeResponse.isAdmin`) — sources: User.role === "ADMIN" OR email in
 * ADMIN_EMAILS env. Renders nothing while bootstrapping so we don't flash
 * the admin shell.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const me = useMeStore((s) => s.me);
    const loading = useMeStore((s) => s.loading);
    const initialized = useMeStore((s) => s.initialized);

    useEffect(() => {
        if (!session?.user) {
            router.replace("/");
            return;
        }
        if (!initialized || loading) return;
        if (!me?.isAdmin) router.replace("/home/dashboard");
    }, [session?.user, initialized, loading, me?.isAdmin, router]);

    if (!session?.user) return null;
    if (!initialized || loading) return <BootSkeleton />;
    if (!me?.isAdmin) return null;

    return <>{children}</>;
}

function BootSkeleton() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-[12px] text-muted-foreground">Loading…</div>
        </div>
    );
}
