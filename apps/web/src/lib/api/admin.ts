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
    isVerified: boolean;
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

export type AdminStudentVerificationResult = {
    student: { userId: string; isVerified: boolean };
};

export type AdminCancellationRequest = {
    id: string;
    reason: string;
    otherText: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    listingsUsedAtRequest: number;
    adminNote: string | null;
    resolvedAt: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        isPremium: boolean;
        companyMemberships: Array<{
            company: { id: string; name: string; slug: string };
        }>;
    };
    payment: {
        id: string;
        planCode: string;
        planName: string;
        amount: number;
        currency: string;
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
        verified?: "true" | "false";
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: AdminStudentListItem[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/students", params),
    set_student_verification: (userId: string, input: { verified: boolean }) =>
        api.post<AdminStudentVerificationResult>(
            `/admin/student/${userId}/verify`,
            input,
        ),
    list_cancellation_requests: (params?: {
        status?: "PENDING" | "APPROVED" | "REJECTED";
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: AdminCancellationRequest[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/cancellation-requests", params),
    update_cancellation_request: (
        id: string,
        input: { action: "approve" | "reject"; adminNote?: string },
    ) =>
        api.patch<{
            request: { id: string; status: string; resolvedAt: string | null };
        }>(`/admin/cancellation-requests/${id}`, input),
};
