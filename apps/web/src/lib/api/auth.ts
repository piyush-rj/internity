import { api } from "../apiClient";
import type { User, UserRole } from "./types";

export type MeResponse = {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
    hasStudentProfile: boolean;
    hasEmployerProfile: boolean;
};

export const authApi = {
    me: () => api.get<MeResponse>("/auth/me"),
    set_role: (role: Exclude<UserRole, "ADMIN">) =>
        api.post<{ role: UserRole }>("/auth/role", { role }),
};

export type { User };
