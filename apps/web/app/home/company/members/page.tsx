"use client";

import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { MembersCard } from "@/src/components/company/MembersCard";
import {
    CompanyCardSkeleton,
    NoCompany,
} from "@/src/components/company/CompanyEmptyStates";
import { useCompanyMembers } from "@/src/hooks/useCompanyMembers";
import { useMe } from "@/src/hooks/useMe";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { canManageCompany } from "@/src/lib/catalog/companyRoles";

export default function CompanyMembersPage() {
    const { me } = useMe();
    const { memberships, loading } = useMyEmployer();
    const membership = memberships[0] ?? null;
    const companyId = membership?.company.id ?? null;
    const canAdmin = membership ? canManageCompany(membership.role) : false;

    const {
        members,
        loading: membersLoading,
        error: membersError,
        updateRole,
        remove,
    } = useCompanyMembers(companyId);

    return (
        <EmptySection
            title="Company members"
            description="The people who can post listings and act on applicants for your company."
        >
            {loading && !membership ? (
                <CompanyCardSkeleton />
            ) : !membership ? (
                <NoCompany />
            ) : (
                <MembersCard
                    companyId={companyId}
                    members={members}
                    loading={membersLoading}
                    error={membersError}
                    canManage={canAdmin}
                    currentUserId={me?.id ?? null}
                    onUpdateRole={updateRole}
                    onRemove={remove}
                />
            )}
        </EmptySection>
    );
}
