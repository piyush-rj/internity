"use client";

import { useEffect } from "react";
import { useAppliedStore } from "@/src/store/useAppliedStore";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// hydrates the applied-listings store for signed-in students
export function AppliedBootstrap() {
    const session = useUserSessionStore((s) => s.session);
    const role = useMeStore((s) => s.me?.role);
    const init = useAppliedStore((s) => s.init);

    useEffect(() => {
        if (session?.user && role === "STUDENT") init();
    }, [session?.user, role, init]);

    return null;
}
