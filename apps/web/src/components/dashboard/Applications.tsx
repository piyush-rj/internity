"use client";

import { ApplicationsList } from "@/src/components/applications/ApplicationsList";
import { useMyApplications } from "@/src/hooks/useMyApplications";

export function Applications() {
    const { items, loading, error } = useMyApplications();

    return (
        <ApplicationsList
            items={items.slice(0, 4)}
            loading={loading}
            error={error}
            compact
            emptyText="You haven’t applied anywhere yet — start with a recommended internship."
        />
    );
}
