import { api } from "../apiClient";

export type PlanCode = "PER_POST" | "MONTHLY" | "YEARLY";

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
        // null = unlimited (Yearly) or no active plan.
        listingLimit: number | null;
    };
    payments: MyPayment[];
};

export const paymentApi = {
    list_mine: () => api.get<MyPlansResponse>("/payment/mine"),
    create_order: (planCode: PlanCode) =>
        api.post<CreateOrderResponse>("/payment/order", { planCode }),
    verify: (input: VerifyInput) =>
        api.post<{ ok: true; planCode: PlanCode }>("/payment/verify", input),
};
