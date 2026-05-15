"use client";

import { useCallback, useEffect, useState } from "react";
import {
    employerApi,
    type Company,
    type CompanyMember,
    type EmployerProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type EmployerMembership = CompanyMember & { company: Company };

export type EmployerState = {
    profile: EmployerProfile | null;
    memberships: EmployerMembership[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

export function useMyEmployer(): EmployerState {
    const [profile, setProfile] = useState<EmployerProfile | null>(null);
    const [memberships, setMemberships] = useState<EmployerMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchEmployer = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await employerApi.get_me();
            setProfile(data.profile);
            setMemberships(data.memberships);
        } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) {
                setProfile(null);
                setMemberships([]);
            } else {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchEmployer();
    }, [fetchEmployer]);

    return {
        profile,
        memberships,
        loading,
        error,
        refetch: fetchEmployer,
    };
}
