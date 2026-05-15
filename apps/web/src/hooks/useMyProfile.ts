"use client";
import { useCallback, useEffect, useState } from "react";
import { studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type ProfileState = {
    profile: StudentProfile | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

export function useMyProfile(): ProfileState {
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { profile } = await studentApi.get_me();
            setProfile(profile);
        } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) {
                setProfile(null);
            } else {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile };
}
