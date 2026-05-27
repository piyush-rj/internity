"use client";

import { useMemo, useState } from "react";
import { ApplicationCards } from "@/src/components/applications/ApplicationCards";
import {
    ApplicationsFilterPanel,
    applyApplicationsFilters,
    emptyApplicationsFilters,
    type ApplicationsFilters,
} from "@/src/components/applications/ApplicationsFilterPanel";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { useMyApplications } from "@/src/hooks/useMyApplications";

export default function ApplicationsPage() {
    const { items, loading, error, withdraw } = useMyApplications();
    const [filters, setFilters] = useState<ApplicationsFilters>(
        emptyApplicationsFilters,
    );

    const filtered = useMemo(
        () => applyApplicationsFilters(items, filters),
        [items, filters],
    );

    const hasActiveFilters =
        filters.q.trim().length > 0 ||
        filters.statuses.size > 0 ||
        filters.jobTitle !== "";

    return (
        <EmptySection
            title="Applications"
            description="Track every internship and job you've applied to."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0">
                    <ApplicationCards
                        items={filtered}
                        loading={loading}
                        error={error}
                        onWithdraw={withdraw}
                        emptyText={
                            hasActiveFilters
                                ? "No applications match these filters."
                                : "You haven’t applied anywhere yet."
                        }
                    />
                </div>
                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <ApplicationsFilterPanel
                        filters={filters}
                        onChange={setFilters}
                    />
                </aside>
            </div>
        </EmptySection>
    );
}
