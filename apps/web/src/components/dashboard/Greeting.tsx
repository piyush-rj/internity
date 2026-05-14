"use client";

import { TrendingUpIcon } from "@/src/components/dashboard/icons";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

export function Greeting() {
    const { profile, loading } = useMyProfile();
    const session = useUserSessionStore((s) => s.session);
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
    const greeting = greetingForNow();
    const name = profile?.firstName ?? null;

    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="text-[26px] font-semibold tracking-tight">
                    {loading ? (
                        <span className="inline-block h-7 w-56 rounded-md bg-secondary animate-pulse" />
                    ) : (
                        <>
                            {greeting},{" "}
                            <span className="text-foreground">
                                {(session?.user?.name)?.split(" ")[0] ?? "there"}
                            </span>
                        </>
                    )}
                </h1>
                <p className="mt-1 text-[13px] text-muted-foreground">
                    {today}
                </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 h-9 text-[12px]">
                <TrendingUpIcon className="text-success h-3.5 w-3.5" />
                <span className="text-muted-foreground">Your profile is</span>
                <span className="font-medium text-success">
                    12% more visible
                </span>
                <span className="text-muted-foreground">this week</span>
            </div>
        </div>
    );
}

function greetingForNow(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}
