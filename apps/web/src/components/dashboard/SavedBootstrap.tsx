"use client";

import { useEffect } from "react";
import { useSavedStore } from "@/src/store/useSavedStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

/**
 * Eagerly hydrate the saved-listings store after sign-in so every ListingCard
 * across the dashboard reflects accurate save state without a per-card fetch.
 */
export function SavedBootstrap() {
    const session = useUserSessionStore((s) => s.session);
    const init = useSavedStore((s) => s.init);

    useEffect(() => {
        if (session?.user) init();
    }, [session?.user, init]);

    return null;
}
