"use client";

import { useEffect } from "react";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

/**
 * Fetch /auth/me once after sign-in so role and profile flags are available
 * everywhere (sidebar, role gate, settings) without per-component fetches.
 */
export function MeBootstrap() {
    const session = useUserSessionStore((s) => s.session);
    const init = useMeStore((s) => s.init);

    useEffect(() => {
        if (session?.user) init();
    }, [session?.user, init]);

    return null;
}
