"use client";

import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingsBoard } from "@/src/components/manage-listings/ListingsBoard";
import {
    CompanyCardSkeleton,
    NoCompany,
} from "@/src/components/company/CompanyEmptyStates";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";

export default function CompanyListingsPage() {
    const { memberships, loading } = useMyEmployer();
    const membership = memberships[0] ?? null;
    const companyId = membership?.company.id ?? null;

    if (loading && !membership) {
        return (
            <EmptySection
                title="Company’s listings"
                description="Every listing posted under your company."
            >
                <CompanyCardSkeleton />
            </EmptySection>
        );
    }
    if (!companyId) {
        return (
            <EmptySection
                title="Company’s listings"
                description="Every listing posted under your company."
            >
                <NoCompany />
            </EmptySection>
        );
    }

    return (
        <ListingsBoard
            scope="company"
            companyId={companyId}
            title="Company’s listings"
            description="Every listing posted under your company — by any team member."
        />
    );
}
