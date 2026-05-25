"use client";

import { useEffect } from "react";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// fetches /auth/me once after sign-in
export function MeBootstrap() {
    const session = useUserSessionStore((s) => s.session);
    const init = useMeStore((s) => s.init);

    useEffect(() => {
        if (session?.user) init();
    }, [session?.user, init]);

    return null;
}
