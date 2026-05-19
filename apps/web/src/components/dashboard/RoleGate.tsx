"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolePicker } from "@/src/components/dashboard/RolePicker";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

/**
 * Gates first-time users at the dashboard. Three cases:
 *
 *  1. Brand-new user — no role picked yet (roleConfirmed=false) and no
 *     profile yet → show the role picker. Their pick routes them onward.
 *  2. Role picked but profile not completed → no picker (would feel like
 *     "pick role again"), instead nudge them with a toast linking to the
 *     right onboarding page.
 *  3. Fresh employer who picked their role but hasn't set up a company →
 *     redirect them into /home/employer/setup so the company form is the
 *     only thing they can do until they finish.
 *
 * Self-disables on the relevant onboarding pages so we don't fight the
 * forms there.
 */
export function RoleGate() {
    const session = useUserSessionStore((s) => s.session);
    const { me, loading, refetch } = useMe();
    const router = useRouter();
    const pathname = usePathname() ?? "";

    // Once the user has picked, hide the picker immediately. Profile flags
    // won't flip to true until the user actually creates a profile, so we
    // can't lean on the API state alone to dismiss.
    const [picked, setPicked] = useState(false);

    const profileComplete = !!(me?.hasStudentProfile || me?.hasEmployerProfile);
    const needsProfileNudge =
        !!me &&
        me.roleConfirmed &&
        !profileComplete &&
        !pathname.startsWith("/home/profile") &&
        !pathname.startsWith("/home/employer/setup");

    // Toast fires at most once per browser tab session, per user. The
    // navbar pill is the persistent reminder after that.
    useEffect(() => {
        if (!needsProfileNudge || !me) return;
        if (typeof window === "undefined") return;

        const flagKey = `roleGate-nudge-shown:${me.id}`;
        if (window.sessionStorage.getItem(flagKey)) return;
        window.sessionStorage.setItem(flagKey, "1");

        const isEmployer = me.role === "EMPLOYER";
        toast(
            isEmployer
                ? "Finish setting up your company"
                : "Complete your profile",
            {
                description: isEmployer
                    ? "Add your company details to start posting listings."
                    : "Add your basics so employers can find you.",
                action: {
                    label: isEmployer ? "Set up company" : "Open profile",
                    onClick: () =>
                        router.push(
                            isEmployer
                                ? "/home/employer/setup"
                                : "/home/profile",
                        ),
                },
                duration: 8000,
            },
        );
    }, [needsProfileNudge, me, router]);

    if (!session?.user || loading || !me) return null;

    // Pre-setup gate for fresh employers: they have a role but no company yet.
    if (
        me.role === "EMPLOYER" &&
        me.roleConfirmed &&
        !me.hasEmployerProfile &&
        !pathname.startsWith("/home/employer/setup")
    ) {
        router.replace("/home/employer/setup");
        return null;
    }

    if (profileComplete) return null;

    // Student onboarding flows directly into /home/profile — the page itself
    // prompts the user. RoleGate gets out of the way.
    if (
        me.role === "STUDENT" &&
        me.roleConfirmed &&
        pathname.startsWith("/home/profile")
    ) {
        return null;
    }

    // Role already picked — don't ask again. Toast effect above handles UX.
    if (me.roleConfirmed) return null;

    if (picked) return null;

    return (
        <RolePicker
            onChosen={async (role) => {
                setPicked(true);
                if (role === "STUDENT") {
                    router.push("/home/profile");
                } else {
                    router.push("/home/employer/setup");
                }
                // Best-effort refresh; not awaited so the redirect feels instant.
                refetch();
            }}
        />
    );
}
