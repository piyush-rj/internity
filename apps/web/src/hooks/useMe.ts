"use client";
import type { MeResponse } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";

export type MeState = {
    me: MeResponse | null;
    loading: boolean;
    error: ApiClientError | Error | null;
    refetch: () => Promise<void>;
};

export function useMe(): MeState {
    const me = useMeStore((s) => s.me);
    const loading = useMeStore((s) => s.loading);
    const error = useMeStore((s) => s.error);
    const refetch = useMeStore((s) => s.refetch);

    return { me, loading, error, refetch };
}
