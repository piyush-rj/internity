"use client";

import { useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
    type AppSession,
    type SessionUser,
    useUserSessionStore,
} from "@/src/store/useUserSessionStore";
import { useMeStore } from "@/src/store/useMeStore";
import { useMyProfileStore } from "@/src/store/useMyProfileStore";

function toAppSession(
    user: {
        id: string;
        email?: string | null;
        phone?: string | null;
        user_metadata?: Record<string, unknown>;
    } | null,
): AppSession {
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    const sessionUser: SessionUser = {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        name:
            (meta.full_name as string | undefined) ??
            (meta.name as string | undefined) ??
            null,
        image: (meta.avatar_url as string | undefined) ?? null,
    };
    return { user: sessionUser };
}

/**
 * Mirrors Supabase auth state into the Zustand session store so existing
 * components (NavBar, UserMenu, Sidebar, etc.) keep working without each
 * having to subscribe to Supabase directly.
 *
 * Also resets useMeStore on sign-out so a logged-out tab doesn't keep
 * stale profile data in memory.
 */
export function SessionSetter() {
    const setSession = useUserSessionStore((s) => s.setSession);
    const resetMe = useMeStore((s) => s.reset);
    const resetMyProfile = useMyProfileStore((s) => s.reset);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            setSession(toAppSession(data.user));
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(toAppSession(session?.user ?? null));
            if (event === "SIGNED_OUT") {
                resetMe();
                resetMyProfile();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setSession, resetMe, resetMyProfile]);

    return null;
}
