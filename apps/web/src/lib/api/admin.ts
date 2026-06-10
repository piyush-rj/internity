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
    list_coupons: (params?: { page?: number; pageSize?: number }) =>
        api.get<{
            items: AdminCoupon[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/coupons", params),
    create_coupon: (input: {
        code: string;
        defaultDiscountPct: number;
        discountPctPerPost?: number;
        discountPctMonthly?: number;
        discountPctYearly?: number;
        expiresAt?: string;
    }) =>
        api.post<{ coupon: { id: string; code: string } }>(
            "/admin/coupons",
            input,
        ),
    revoke_coupon: (id: string) =>
        api.patch<{ coupon: { id: string; isActive: boolean } }>(
            `/admin/coupons/${id}/revoke`,
            {},
        ),
    list_offers: (params?: { page?: number; pageSize?: number }) =>
        api.get<{
            items: AdminOffer[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/offers", params),
    create_offer: (input: {
        title: string;
        description?: string;
        defaultDiscountPct: number;
        discountPctPerPost?: number;
        discountPctMonthly?: number;
        discountPctYearly?: number;
        expiresAt?: string;
    }) =>
        api.post<{ offer: { id: string; title: string } }>(
            "/admin/offers",
            input,
        ),
    revoke_offer: (id: string) =>
        api.patch<{ offer: { id: string; isActive: boolean } }>(
            `/admin/offers/${id}/revoke`,
            {},
        ),
    search_companies: (q: string) =>
        api.get<{ companies: AdminCompanySearchResult[] }>(
            "/admin/company-search",
            { q },
        ),
    list_free_posting_grants: (params?: { page?: number; pageSize?: number }) =>
        api.get<{
            items: AdminFreePostingGrant[];
            page: number;
            pageSize: number;
            total: number;
        }>("/admin/allow-postings", params),
    create_free_posting_grant: (input: {
        companyId: string;
        grantedPostings: number;
        note?: string;
        expiresAt?: string;
    }) =>
        api.post<{
            grant: {
                id: string;
                grantedPostings: number;
                expiresAt: string | null;
                companyName: string;
            };
        }>("/admin/allow-postings", input),
    revoke_free_posting_grant: (id: string) =>
        api.patch<{ ok: true }>(`/admin/allow-postings/${id}/revoke`, {}),
};

type AdminUser = { id: string; name: string | null; email: string | null };

export type AdminCoupon = {
    id: string;
    code: string;
    discountPctPerPost: number;
    discountPctMonthly: number;
    discountPctYearly: number;
    isActive: boolean;
    isExpired: boolean;
    revokedAt: string | null;
    revokedBy: AdminUser | null;
    expiresAt: string;
    createdAt: string;
    createdBy: AdminUser;
    redemptionCount: number;
};

export type AdminOffer = {
    id: string;
    title: string;
    description: string | null;
    discountPctPerPost: number;
    discountPctMonthly: number;
    discountPctYearly: number;
    isActive: boolean;
    isExpired: boolean;
    revokedAt: string | null;
    revokedBy: AdminUser | null;
    expiresAt: string;
    createdAt: string;
    createdBy: AdminUser;
};

export type AdminCompanySearchResult = {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    verificationStatus: string;
    isPremium: boolean;
    freeListingUsed: boolean;
    freePostingGrants: Array<{
        id: string;
        grantedPostings: number;
        usedPostings: number;
    }>;
};

export type AdminFreePostingGrant = {
    id: string;
    grantedPostings: number;
    usedPostings: number;
    remainingPostings: number;
    note: string | null;
    isActive: boolean;
    isExpired: boolean;
    expiresAt: string | null;
    revokedAt: string | null;
    revokedBy: AdminUser | null;
    createdAt: string;
    company: { id: string; name: string; slug: string; logoUrl: string | null };
    grantedBy: AdminUser;
};
