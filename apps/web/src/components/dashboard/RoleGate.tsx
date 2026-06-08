"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolePicker } from "@/src/components/dashboard/RolePicker";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";

// Routes only employers/admins should reach. A student who follows a stray
// link here — e.g. the footer's "Post an internship", which hard-links to
// /home/manage-listings/new — would otherwise land on a confusing "set up a
// company" empty state. Bounce them back to their dashboard instead.
const EMPLOYER_ONLY_PREFIXES = [
    "/home/manage-listings",
    "/home/applicants",
    "/home/company",
    "/home/employer",
    "/home/plans",
    "/home/explore-plans",
    "/home/drafts",
];

// Routes only students should reach. An employer who lands here gets the same
// "page doesn't exist" bounce back to their dashboard.
const STUDENT_ONLY_PREFIXES = [
    "/home/resume",
    "/home/applications",
    "/home/saved",
];

// gates first-time users at the dashboard for role pick and onboarding
export function RoleGate() {
    const session = useUserSessionStore((s) => s.session);
    const { me, loading, refetch } = useMe();
    const router = useRouter();
    const pathname = usePathname() ?? "";

    const [picked, setPicked] = useState(false);

    const onEmployerOnlyRoute = EMPLOYER_ONLY_PREFIXES.some((p) =>
        pathname.startsWith(p),
    );
    const onStudentOnlyRoute = STUDENT_ONLY_PREFIXES.some((p) =>
        pathname.startsWith(p),
    );
    const onRoleRestrictedRoute = onEmployerOnlyRoute || onStudentOnlyRoute;

    // A confirmed user sitting on a route reserved for the other role. Both
    // directions are treated the same: the page simply doesn't exist for them.
    const roleMismatch =
        !!me &&
        me.roleConfirmed &&
        ((me.role === "STUDENT" && onEmployerOnlyRoute) ||
            (me.role === "EMPLOYER" && onStudentOnlyRoute));

    useEffect(() => {
        if (!roleMismatch) return;
        toast.error("Page doesn't exist");
    }, [roleMismatch]);

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

    if (!session?.user) return null;

    // On role-restricted routes we can't let the page paint until we know the
    // role — otherwise the page flashes for the fraction of a second it takes
    // /auth/me to resolve (and again while we redirect a mismatched user away).
    // Block it behind a skeleton overlay until the user is confirmed allowed.
    if (onRoleRestrictedRoute && (loading || !me || roleMismatch)) {
        if (roleMismatch) router.replace("/home/dashboard");
        return <RouteGuardSkeleton />;
    }

    if (loading || !me) return null;

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

// Covers the content area (beside the sidebar on desktop) while we resolve the
// role on an employer-only route, so the employer page never flashes before a
// student is redirected away.
function RouteGuardSkeleton() {
    return (
        <div
            aria-hidden
            className="fixed inset-0 z-40 bg-neutral-50 lg:left-60"
        >
            <div className="mx-auto max-w-6xl px-6 pt-8 animate-pulse">
                <div className="h-7 w-56 rounded-md bg-secondary" />
                <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-secondary/70" />
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                    <div className="space-y-4">
                        <div className="h-40 rounded-lg border border-border bg-card" />
                        <div className="h-64 rounded-lg border border-border bg-card" />
                    </div>
                    <div className="h-72 rounded-lg border border-border bg-card" />
                </div>
            </div>
        </div>
    );
}
