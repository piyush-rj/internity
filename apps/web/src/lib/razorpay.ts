import { paymentApi, type PlanCode } from "@/src/lib/api/payment";

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

type RazorpayHandlerArgs = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: RazorpayHandlerArgs) => void;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
    open: () => void;
    on: (
        event: "payment.failed",
        cb: (resp: { error: { description?: string } }) => void,
    ) => void;
};

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${SCRIPT_SRC}"]`,
        );
        if (existing) {
            existing.addEventListener("load", () => resolve(true));
            existing.addEventListener("error", () => resolve(false));
            return;
        }
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export type CheckoutInput = {
    planCode: PlanCode;
    companyId: string;
    prefill?: { name?: string; email?: string };
    onSuccess?: () => void | Promise<void>;
    onDismiss?: () => void;
    onFailure?: (message: string) => void;
};

export async function openCheckout(input: CheckoutInput): Promise<void> {
    const ok = await loadScript();
    if (!ok) {
        throw new Error("Couldn’t load the payment gateway. Try again.");
    }
    const order = await paymentApi.create_order(input.planCode, input.companyId);

    const instance = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: order.planName,
        description: order.planDescription,
        prefill: input.prefill,
        theme: { color: "#ea580c" },
        modal: { ondismiss: input.onDismiss },
        handler: async (resp) => {
            try {
                await paymentApi.verify({
                    planCode: input.planCode,
                    razorpay_order_id: resp.razorpay_order_id,
                    razorpay_payment_id: resp.razorpay_payment_id,
                    razorpay_signature: resp.razorpay_signature,
                });
                await input.onSuccess?.();
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Payment verification failed.";
                console.error("Razorpay verify failed:", err);
                input.onFailure?.(message);
            }
        },
    });
    instance.on("payment.failed", (resp) => {
        const message =
            resp.error?.description ?? "Payment failed. Please try again.";
        console.error("Razorpay payment failed:", message);
        input.onFailure?.(message);
    });
    instance.open();
}
