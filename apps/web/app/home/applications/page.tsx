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

type Tab = "active" | "deleted";

export default function ApplicationsPage() {
    useBreadcrumbLabel("My Applications");
    const { items, loading, error, withdraw, restore } = useMyApplications();
    const [filters, setFilters] = useState<ApplicationsFilters>(
        emptyApplicationsFilters,
    );
    const [tab, setTab] = useState<Tab>("active");

    // Recently Deleted holds withdrawn applications; everything else is the
    // active list. Filters (search/sort/role/status) apply within each tab.
    const activeItems = useMemo(
        () =>
            applyApplicationsFilters(
                items.filter((a) => a.status !== "WITHDRAWN"),
                filters,
            ),
        [items, filters],
    );
    const deletedItems = useMemo(
        () =>
            applyApplicationsFilters(
                items.filter((a) => a.status === "WITHDRAWN"),
                filters,
            ),
        [items, filters],
    );
    const deletedCount = useMemo(
        () => items.filter((a) => a.status === "WITHDRAWN").length,
        [items],
    );

    const hasActiveFilters =
        filters.q.trim().length > 0 ||
        filters.statuses.size > 0 ||
        filters.jobTitle !== "";

    const showing = tab === "active" ? activeItems : deletedItems;

    return (
        <EmptySection
            title="My Applications"
            description="Track every internship you've applied to."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 space-y-5">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-card w-fit">
                        <TabButton
                            active={tab === "active"}
                            onClick={() => setTab("active")}
                        >
                            Active
                        </TabButton>
                        <TabButton
                            active={tab === "deleted"}
                            onClick={() => setTab("deleted")}
                        >
                            Recently Deleted
                            {deletedCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-md bg-secondary text-[10.5px] font-semibold tabular-nums">
                                    {deletedCount}
                                </span>
                            )}
                        </TabButton>
                    </div>

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

                    {tab === "deleted" && deletedCount > 0 && (
                        <p className="text-[12px] text-muted-foreground">
                            Applications you’ve withdrawn. Restore one to apply
                            again — only while the internship is still open.
                        </p>
                    )}

                    <ApplicationCards
                        items={showing}
                        loading={loading}
                        error={error}
                        onWithdraw={tab === "active" ? withdraw : undefined}
                        onRestore={tab === "deleted" ? restore : undefined}
                        emptyText={
                            tab === "deleted"
                                ? hasActiveFilters
                                    ? "No withdrawn applications match these filters."
                                    : "Nothing here. Withdrawn applications show up in Recently Deleted."
                                : hasActiveFilters
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

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                "inline-flex items-center h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors cursor-pointer " +
                (active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")
            }
        >
            {children}
        </button>
    );
}
