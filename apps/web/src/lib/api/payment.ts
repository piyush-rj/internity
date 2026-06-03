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

export const paymentApi = {
    create_order: (planCode: PlanCode) =>
        api.post<CreateOrderResponse>("/payment/order", { planCode }),
    verify: (input: VerifyInput) =>
        api.post<{ ok: true; planCode: PlanCode }>("/payment/verify", input),
};
