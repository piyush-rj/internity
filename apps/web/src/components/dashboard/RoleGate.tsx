"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolePicker } from "@/src/components/dashboard/RolePicker";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// gates first-time users at the dashboard for role pick and onboarding
export function RoleGate() {
    const session = useUserSessionStore((s) => s.session);
    const { me, loading, refetch } = useMe();
    const router = useRouter();
    const pathname = usePathname() ?? "";

    const [picked, setPicked] = useState(false);

    const profileComplete = !!(me?.hasStudentProfile || me?.hasEmployerProfile);
    const needsProfileNudge =
        !!me &&
        me.roleConfirmed &&
        !profileComplete &&
        !pathname.startsWith("/home/profile") &&
        !pathname.startsWith("/home/employer/setup");

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

    if (me.isAdmin) {
        // Admins live in /admin, not the student/employer /home shell. Bounce
        // them there from any /home route — e.g. after signing in while
        // applying from a public listing or the internships browse page, where
        // they'd otherwise be stranded in the student dashboard chrome.
        router.replace("/admin");
        return null;
    }

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

    if (
        me.role === "STUDENT" &&
        me.roleConfirmed &&
        pathname.startsWith("/home/profile")
    ) {
        return null;
    }

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
                refetch();
            }}
        />
    );
}
