"use client";

import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

export function Greeting() {
    const { loading } = useMyProfile();
    const session = useUserSessionStore((s) => s.session);
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
    const greeting = greetingForNow();

    return (
        <div className="flex items-end justify-between gap-3 mb-6">
            <div>
                <h1 className="text-[26px] font-semibold tracking-tight">
                    {loading ? (
                        <span className="inline-block h-7 w-56 rounded-md bg-secondary animate-pulse" />
                    ) : (
                        <>
                            {greeting},{" "}
                            <span className="text-foreground">
                                {session?.user?.name?.split(" ")[0] ?? "there"}
                            </span>
                        </>
                    )}
                </h1>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{today}</p>
        </div>
    );
}

function greetingForNow(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}
