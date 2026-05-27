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

export type AdminPaymentRow = {
    id: string;
    planCode: string;
    amount: number;
    currency: string;
    status: "CREATED" | "SUCCESS" | "FAILED";
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        companyMemberships: Array<{
            company: { id: string; name: string; slug: string };
        }>;
    };
};

export type AdminPaymentsResponse = {
    items: AdminPaymentRow[];
    page: number;
    pageSize: number;
    total: number;
};

export type AdminStudentListItem = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    city: string | null;
    college: string | null;
    branch: string | null;
    createdAt: string;
    applicationsCount: number;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        isBanned: boolean;
        banReason: string | null;
        createdAt: string;
    };
};

export const adminApi = {
    get_stats: () => api.get<AdminPlatformStats>("/admin/stats"),
    set_user_ban: (
        userId: string,
        input: { banned: boolean; reason?: string },
    ) => api.post<AdminBanResult>(`/admin/user/${userId}/ban`, input),
    list_payments: (params?: {
        status?: "CREATED" | "SUCCESS" | "FAILED";
        page?: number;
        pageSize?: number;
    }) => api.get<AdminPaymentsResponse>("/admin/payments", params),
    list_students: (params?: {
        q?: string;
        banned?: "true" | "false";
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: AdminStudentListItem[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/students", params),
};
