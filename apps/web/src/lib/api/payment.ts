import { api } from "../apiClient";

export type PlanCode = "PER_POST" | "MONTHLY" | "YEARLY";

export type CancellationReason =
    | "TOO_EXPENSIVE"
    | "LOW_APPLICANT_QUALITY"
    | "ALREADY_HIRED"
    | "FOUND_BETTER_PLATFORM"
    | "TECHNICAL_ISSUES"
    | "OTHER";

export type CancellationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MyCancellationRequest = {
    id: string;
    paymentId: string;
    reason: CancellationReason;
    otherText: string | null;
    status: CancellationRequestStatus;
    listingsUsedAtRequest: number;
    createdAt: string;
};

export type CreateOrderResponse = {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    planName: string;
    planDescription: string;
};

export type VerifyInput = {
    planCode: PlanCode;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

export type MyPayment = {
    id: string;
    planCode: string;
    planName: string;
    amount: number;
    currency: string;
    status: string;
    razorpayPaymentId: string | null;
    razorpayOrderId: string;
    createdAt: string;
    validUntil: string | null;
    listingsPosted: number;
    listingLimit: number | null;
    cancellationRequest: MyCancellationRequest | null;
};

export type MyPlansResponse = {
    currentPlan: {
        isPremium: boolean;
        isActive: boolean;
        code: string | null;
        name: string | null;
        since: string | null;
        until: string | null;
        daysRemaining: number;
        totalDays: number | null;
    };
    usage: {
        listingsUsed: number;
        listingLimit: number | null;
    };
    payments: MyPayment[];
    listingActivity: {
        id: string;
        title: string;
        city: string | null;
        mode: string;
        jobTitle: string | null;
        closedAt: string | null;
        createdAt: string;
    }[];
};

export const paymentApi = {
    list_mine: () => api.get<MyPlansResponse>("/payment/mine"),
    create_order: (planCode: PlanCode, companyId: string) =>
        api.post<CreateOrderResponse>("/payment/order", { planCode, companyId }),
    verify: (input: VerifyInput) =>
        api.post<{ ok: true; planCode: PlanCode }>("/payment/verify", input),
    cancel_request: (input: {
        paymentId: string;
        reason: CancellationReason;
        otherText?: string;
    }) =>
        api.post<{ request: { id: string; status: CancellationRequestStatus } }>(
            "/payment/cancel-request",
            input,
        ),
};
