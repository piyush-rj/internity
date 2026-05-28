"use client";

import { useCallback, useEffect, useState } from "react";
import { companyApi, type CompanyDashboard } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type CompanyDashboardState = {
    data: CompanyDashboard | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

// Loads the owner-only company overview. Pass `null` (no active company, or
// caller lacks the founder/co-founder role) to skip the request entirely —
// the backend gates with a 403, so non-owners should never reach here.
export function useCompanyDashboard(
    companyId: string | null,
): CompanyDashboardState {
    const [data, setData] = useState<CompanyDashboard | null>(null);
    const [loading, setLoading] = useState(companyId !== null);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchDashboard = useCallback(async () => {
        if (!companyId) {
            setData(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { dashboard } = await companyApi.dashboard(companyId);
            setData(dashboard);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDashboard();
    }, [fetchDashboard]);

    return { data, loading, error, refetch: fetchDashboard };
}
