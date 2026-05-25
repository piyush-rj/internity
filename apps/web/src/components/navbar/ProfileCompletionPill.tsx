"use client";

import { useEffect } from "react";
import Link from "next/link";
import { computeCompletion } from "@/src/components/profile-wizard/utils";
import { useMeStore } from "@/src/store/useMeStore";
import { useMyProfileStore } from "@/src/store/useMyProfileStore";
import { cn } from "@/src/lib/utils";

// navbar pill nudging students to finish profile
export function ProfileCompletionPill() {
    const me = useMeStore((s) => s.me);
    const profile = useMyProfileStore((s) => s.profile);
    const initialized = useMyProfileStore((s) => s.initialized);
    const initProfile = useMyProfileStore((s) => s.init);

    const isStudent = !!me && me.roleConfirmed && me.role === "STUDENT";

    useEffect(() => {
        if (isStudent && !initialized) initProfile();
    }, [isStudent, initialized, initProfile]);

    if (!isStudent) return null;

    const { pct } = computeCompletion(profile);
    if (pct >= 100) return null;

    return (
        <Link
            href="/home/profile"
            aria-label={`Profile ${pct}% complete — click to continue`}
            className={cn(
                "inline-flex items-center gap-2",
                "h-8 pl-3.25 pr-1 rounded-full",
                "bg-brand",
                "text-[12px] font-medium text-white",
                "transition-colors cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1",
            )}
        >
            <span className="hidden sm:inline">Complete profile</span>
            <span className="sm:hidden">Profile</span>
            <PctRing pct={pct} />
        </Link>
    );
}

function PctRing({ pct }: { pct: number }) {
    const clamped = Math.max(0, Math.min(100, pct));
    return (
        <span
            className="relative inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0"
            style={{
                background: `conic-gradient(currentColor ${clamped * 3.6}deg, rgb(219 234 254) 0deg)`,
            }}
        >
            <span className="absolute inset-0.75 rounded-full bg-white flex items-center justify-center">
                <span className="text-[9px] font-semibold tabular-nums text-brand">
                    {clamped}
                </span>
            </span>
        </span>
    );
}
