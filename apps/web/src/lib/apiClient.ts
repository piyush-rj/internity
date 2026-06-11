import axios, { AxiosError, type AxiosInstance } from "axios";
import { createClient } from "@/src/lib/supabase/client";
import { ENV } from "@/src/config/config.env";
import { getSupportToken } from "@/src/lib/supportAuth";

const supabase = createClient();

interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
    metadata: { timestamp: string };
}

interface ApiError {
    success: false;
    error: { code: string; message: string };
    metadata: { timestamp: string };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

const client: AxiosInstance = axios.create({
    baseURL: `${ENV.NEXT_PUBLIC_BACKEND_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
    // The support agent's bearer token takes precedence over any Supabase
    // session so the dedicated /support console authenticates as that identity.
    const supportToken = getSupportToken();
    if (supportToken) {
        config.headers.Authorization = `Bearer ${supportToken}`;
        return config;
    }
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export class ApiClientError extends Error {
    code: string;
    status?: number;
    constructor(message: string, code: string, status?: number) {
        super(message);
        this.name = "ApiClientError";
        this.code = code;
        this.status = status;
    }
}

async function request<T>(
    method: "get" | "post" | "patch" | "delete",
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
): Promise<T> {
    try {
        const response = await client.request<ApiEnvelope<T>>({
            method,
            url: path,
            data: body,
            params,
        });
        if (!response.data.success) {
            throw new ApiClientError(
                response.data.error.message,
                response.data.error.code,
                response.status,
            );
        }
        return response.data.data;
    } catch (err) {
        if (err instanceof ApiClientError) throw err;
        if (err instanceof AxiosError) {
            const env = err.response?.data as ApiEnvelope<unknown> | undefined;
            if (env && env.success === false) {
                throw new ApiClientError(
                    env.error.message,
                    env.error.code,
                    err.response?.status,
                );
            }
            throw new ApiClientError(
                err.message,
                "NETWORK_ERROR",
                err.response?.status,
            );
        }
        throw new ApiClientError("Unknown error", "UNKNOWN");
    }
}

export const api = {
    get: <T>(path: string, params?: Record<string, unknown>) =>
        request<T>("get", path, undefined, params),
    post: <T>(path: string, body?: unknown) => request<T>("post", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("patch", path, body),
    delete: <T>(path: string) => request<T>("delete", path),
};

export { client as axiosClient };
