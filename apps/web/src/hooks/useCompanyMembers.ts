"use client";

import { useCallback, useEffect, useState } from "react";
import {
    companyApi,
    type CompanyMemberWithUser,
    type CompanyRole,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export type CompanyMembersState = {
    members: CompanyMemberWithUser[];
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
    add: (email: string, role?: CompanyRole) => Promise<void>;
    updateRole: (userId: string, role: CompanyRole) => Promise<void>;
    remove: (userId: string) => Promise<void>;
};

export function useCompanyMembers(
    companyId: string | null,
): CompanyMembersState {
    const [members, setMembers] = useState<CompanyMemberWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!companyId) {
            setMembers([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { members } = await companyApi.list_members(companyId);
            setMembers(members);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    const add = useCallback(
        async (email: string, role?: CompanyRole) => {
            if (!companyId) return;
            await companyApi.add_member(companyId, { email, role });
            await fetchMembers();
        },
        [companyId, fetchMembers],
    );

    const updateRole = useCallback(
        async (userId: string, role: CompanyRole) => {
            if (!companyId) return;
            await companyApi.update_member_role(companyId, userId, role);
            setMembers((prev) =>
                prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
            );
        },
        [companyId],
    );

    const remove = useCallback(
        async (userId: string) => {
            if (!companyId) return;
            await companyApi.remove_member(companyId, userId);
            setMembers((prev) => prev.filter((m) => m.userId !== userId));
        },
        [companyId],
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchMembers();
    }, [fetchMembers]);

    return {
        members,
        loading,
        error,
        refetch: fetchMembers,
        add,
        updateRole,
        remove,
    };
}
