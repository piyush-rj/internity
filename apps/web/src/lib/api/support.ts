import { api } from "../apiClient";
import type { UserRole } from "./types";

export type SupportLoginResponse = {
    token: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        role: UserRole;
    };
};

export const supportApi = {
    // Logs in the hardcoded support-agent identity with email + password.
    // Returns a bearer token the rest of the app uses (see lib/supportAuth).
    login: (email: string, password: string) =>
        api.post<SupportLoginResponse>("/auth/support-login", {
            email,
            password,
        }),
};
