import { api } from "../apiClient";
import type { User, UserRole } from "./types";

export type MeResponse = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    role: UserRole;
    roleConfirmed: boolean;
    isAdmin: boolean;
    isPremium: boolean;
    needsOnboarding: boolean;
    hasStudentProfile: boolean;
    hasEmployerProfile: boolean;
};

export const authApi = {
    me: () => api.get<MeResponse>("/auth/me"),
    update_me: (body: { name?: string }) =>
        api.patch<MeResponse>("/auth/me", body),
    set_role: (role: Exclude<UserRole, "ADMIN">) =>
        api.post<{ role: UserRole }>("/auth/role", { role }),
};

export type { User };
