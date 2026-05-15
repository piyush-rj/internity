import { api } from "../apiClient";

export type CreateOrderResponse = {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
};

export const paymentApi = {
    create_order: (amount: number, currency: string = "INR") =>
        api.post<CreateOrderResponse>("/payment/order", { amount, currency }),
    verify: (input: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => api.post<{ ok: true }>("/payment/verify", input),
};
