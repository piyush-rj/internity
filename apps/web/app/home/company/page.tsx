"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { CompanyCardSkeleton } from "@/src/components/company/CompanyEmptyStates";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { canManageCompany } from "@/src/lib/catalog/companyRoles";

// /home/company has no content of its own — it routes to the dashboard for
// owners (founder / co-founder) and to the profile for everyone else.
export default function CompanyIndexPage() {
    const router = useRouter();
    const { memberships, loading } = useMyEmployer();

    useEffect(() => {
        if (loading) return;
        const role = memberships[0]?.role ?? null;
        const dest =
            role && canManageCompany(role)
                ? "/home/company/dashboard"
                : "/home/company/profile";
        router.replace(dest);
    }, [loading, memberships, router]);

    return (
        <EmptySection title="Company" description="">
            <CompanyCardSkeleton />
        </EmptySection>
    );
}
