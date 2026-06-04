import { api } from "../apiClient";
import type { JobTitle, User, UserRole } from "./types";

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
    premiumUntil: string | null;
    needsOnboarding: boolean;
    hasStudentProfile: boolean;
    hasEmployerProfile: boolean;
    // Roles the student picked in their profile — drives feed ranking and
    // any "matched roles" UI.
    interestedJobTitles: JobTitle[];
    // The cover letter the student submitted on their most recent apply.
    // Used as the one-click prefill on subsequent Apply forms.
    lastCoverLetter: string | null;
};

export const authApi = {
    me: () => api.get<MeResponse>("/auth/me"),
    update_me: (body: { name?: string }) =>
        api.patch<MeResponse>("/auth/me", body),
    set_role: (role: Exclude<UserRole, "ADMIN">) =>
        api.post<{ role: UserRole }>("/auth/role", { role }),
};

export type { User };
