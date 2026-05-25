import { api } from "../apiClient";

export type AdminPlatformStats = {
    totalStudents: number;
    totalFounders: number;
    totalLiveListings: number;
    applicationsToday: number;
};

export type AdminBanResult = {
    user: {
        id: string;
        isBanned: boolean;
        banReason: string | null;
        bannedAt: string | null;
    };
};

export const adminApi = {
    get_stats: () => api.get<AdminPlatformStats>("/admin/stats"),
    set_user_ban: (
        userId: string,
        input: { banned: boolean; reason?: string },
    ) => api.post<AdminBanResult>(`/admin/user/${userId}/ban`, input),
};
