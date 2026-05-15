"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RolePicker } from "@/src/components/dashboard/RolePicker";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

/**
 * Gates first-time users at the dashboard. Two cases:
 *  - Brand-new user (no student or employer profile yet) → show the role
 *    picker. Their pick routes them to the right starting point.
 *  - Employer who has set a role but hasn't finished setup yet → push them
 *    into /home/employer/setup until they have a company.
 *
 * Self-disables on the setup pages so we don't fight the forms there.
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

    if (!session?.user || loading || !me) return null;

    // Pre-setup gate for fresh employers: they have a role but no company yet.
    if (
        me.role === "EMPLOYER" &&
        !me.hasEmployerProfile &&
        !pathname.startsWith("/home/employer/setup")
    ) {
        router.replace("/home/employer/setup");
        return null;
    }

    if (me.hasStudentProfile || me.hasEmployerProfile) return null;

    // Don't blanket-block the profile creator: a fresh student needs to fill
    // their profile, and that page already prompts them to do so.
    if (
        me.role === "STUDENT" &&
        !me.hasStudentProfile &&
        pathname.startsWith("/home/profile")
    ) {
        return null;
    }

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
