"use client";

import Link from "next/link";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { CompanyInfoCard } from "@/src/components/company/CompanyInfoCard";
import { MembersCard } from "@/src/components/company/MembersCard";
import { useCompanyMembers } from "@/src/hooks/useCompanyMembers";
import { useMe } from "@/src/hooks/useMe";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";

export default function CompanyPage() {
    const { me } = useMe();
    const { memberships, loading, refetch } = useMyEmployer();
    const membership = memberships[0] ?? null;
    const companyId = membership?.company.id ?? null;
    const isOwner = membership?.role === "OWNER";

    const {
        members,
        loading: membersLoading,
        error: membersError,
        add,
        updateRole,
        remove,
    } = useCompanyMembers(companyId);

    return (
        <EmptySection
            title="Company"
            description="Your public company page and the people who can post listings."
        >
            {loading && !membership ? (
                <SectionSkeleton />
            ) : !membership ? (
                <NoCompany />
            ) : (
                <>
                    <CompanyInfoCard
                        company={membership.company}
                        canEdit={isOwner}
                        onSaved={refetch}
                    />
                    <MembersCard
                        members={members}
                        loading={membersLoading}
                        error={membersError}
                        canManage={isOwner}
                        currentUserId={me?.id ?? null}
                        onAdd={add}
                        onUpdateRole={updateRole}
                        onRemove={remove}
                    />
                </>
            )}
        </EmptySection>
    );
}

function SectionSkeleton() {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-md bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                </div>
            </div>
            <div className="h-32 w-full rounded-lg bg-secondary/40 animate-pulse" />
        </div>
    );
}

function NoCompany() {
    return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium">
                You haven’t set up a company yet.
            </p>
            <Link
                href="/home/employer/setup"
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                Finish employer setup →
            </Link>
        </div>
    );
}
