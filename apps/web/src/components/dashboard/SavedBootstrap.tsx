"use client";

import { useEffect } from "react";
import { useSavedStore } from "@/src/store/useSavedStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// hydrates the saved-listings store after sign-in
export function SavedBootstrap() {
    const session = useUserSessionStore((s) => s.session);
    const init = useSavedStore((s) => s.init);

    useEffect(() => {
        if (session?.user) init();
    }, [session?.user, init]);

    return null;
}
