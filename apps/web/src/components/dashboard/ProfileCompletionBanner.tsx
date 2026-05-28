"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRoundCheck, X, ArrowRight } from "lucide-react";
import { computeCompletion } from "@/src/components/profile-wizard/utils";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useMeStore } from "@/src/store/useMeStore";
import { cn } from "@/src/lib/utils";

const DISMISS_KEY = "spider:profile-banner:dismissed";
const SHOW_DELAY_MS = 2500;

export function ProfileCompletionBanner() {
    const role = useMeStore((s) => s.me?.role);
    const initialized = useMeStore((s) => s.initialized);
    const { profile, loading } = useMyProfile();

    const [dismissed, setDismissed] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    }, []);

    const { pct } = computeCompletion(profile);
    const eligible =
        initialized &&
        role === "STUDENT" &&
        !loading &&
        pct < 100 &&
        !dismissed;

    useEffect(() => {
        if (!eligible) {
            setVisible(false);
            return;
        }
        const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(t);
    }, [eligible]);

    if (!visible) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
    };

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed z-50 bottom-5 right-5 w-90 max-w-[calc(100vw-2.5rem)]",
                "rounded-xl border border-border bg-brand",
                "shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]",
                "animate-in fade-in slide-in-from-bottom-3 duration-300",
            )}
        >
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss"
                className={cn(
                    "absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center",
                    "rounded-md text-neutral-100 hover:bg-white/15",
                    "transition-colors cursor-pointer",
                )}
            >
                <X className="h-4 w-4" />
            </button>

            <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand">
                        <UserRoundCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-white">
                            Complete your profile
                        </p>
                        <p className="text-[11.5px] text-neutral-200 tabular-nums">
                            {pct}% complete · {100 - pct}% to go
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-[12.5px] text-neutral-200 leading-relaxed">
                    A complete profile gets noticed faster. Finish the remaining
                    sections to boost your chances of getting hired.
                </p>

                <div className="mt-3 h-1.5 w-full rounded-full bg-orange-800 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className={cn(
                            "inline-flex h-9 items-center rounded-lg px-3",
                            "text-[12.5px] font-medium text-white",
                            "transition-colors cursor-pointer hover:underline",
                        )}
                    >
                        Later
                    </button>
                    <Link
                        href="/home/profile"
                        onClick={handleDismiss}
                        className={cn(
                            "inline-flex h-9 items-center gap-1.5 rounded-lg",
                            "px-3.5 text-[12.5px] font-medium bg-white text-black",
                            "hover:bg-white transition-colors group",
                        )}
                    >
                        Open profile
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-all transform duration-200" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
