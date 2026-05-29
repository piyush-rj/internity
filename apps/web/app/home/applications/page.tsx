"use client";

import { useMemo, useState } from "react";
import { ApplicationCards } from "@/src/components/applications/ApplicationCards";
import {
    ApplicationsFilterPanel,
    applyApplicationsFilters,
    countApplicationsFilters,
    emptyApplicationsFilters,
    type ApplicationsFilters,
} from "@/src/components/applications/ApplicationsFilterPanel";
import { FilterDrawer } from "@/src/components/base/FilterDrawer";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { useBreadcrumbLabel } from "@/src/components/dashboard/BreadcrumbContext";
import { useMyApplications } from "@/src/hooks/useMyApplications";

export default function ApplicationsPage() {
    useBreadcrumbLabel("My Applications");
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
            title="My Applications"
            description="Track every internship you've applied to."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-5">
                    <div className="lg:hidden">
                        <FilterDrawer
                            activeCount={countApplicationsFilters(filters)}
                        >
                            {(close) => (
                                <ApplicationsFilterPanel
                                    filters={filters}
                                    onChange={setFilters}
                                    onApplied={close}
                                />
                            )}
                        </FilterDrawer>
                    </div>
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
                <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
                    <ApplicationsFilterPanel
                        filters={filters}
                        onChange={setFilters}
                    />
                </aside>
            </div>
        </EmptySection>
    );
}
