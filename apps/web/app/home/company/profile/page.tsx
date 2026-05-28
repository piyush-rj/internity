"use client";

import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { CompanyInfoCard } from "@/src/components/company/CompanyInfoCard";
import {
    CompanyCardSkeleton,
    NoCompany,
} from "@/src/components/company/CompanyEmptyStates";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { canManageCompany } from "@/src/lib/catalog/companyRoles";

export default function CompanyProfilePage() {
    const { memberships, loading, refetch } = useMyEmployer();
    const membership = memberships[0] ?? null;
    // Founder + co-founder + legacy OWNER can edit; others see it read-only.
    const canAdmin = membership ? canManageCompany(membership.role) : false;

    return (
        <EmptySection
            title="Company profile"
            description="Your public company page that candidates see on every listing."
        >
            {loading && !membership ? (
                <CompanyCardSkeleton />
            ) : !membership ? (
                <NoCompany />
            ) : (
                <CompanyInfoCard
                    company={membership.company}
                    canEdit={canAdmin}
                    onSaved={refetch}
                />
            )}
        </EmptySection>
    );
}
