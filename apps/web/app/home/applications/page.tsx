"use client";

import { ApplicationsList } from "@/src/components/applications/ApplicationsList";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListHeader } from "@/src/components/listings/ListHeader";
import { useMyApplications } from "@/src/hooks/useMyApplications";

export default function ApplicationsPage() {
    const { items, loading, error, withdraw } = useMyApplications();

    return (
        <EmptySection
            title="Applications"
            description="Track every internship and job you've applied to."
        >
            <ListHeader
                title="All applications"
                count={items.length}
                countLabel="total"
                loading={loading}
            />

            <div className="mt-5">
                <ApplicationsList
                    items={items}
                    loading={loading}
                    error={error}
                    onWithdraw={withdraw}
                />
            </div>
        </EmptySection>
    );
}
