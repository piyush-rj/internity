import { paymentApi } from "@/src/lib/api";

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
    amountInPaise: number;
    currency?: string;
    name?: string;
    description?: string;
    prefill?: { name?: string; email?: string };
    onSuccess?: () => void;
    onDismiss?: () => void;
};

export async function openCheckout(input: CheckoutInput): Promise<void> {
    const ok = await loadScript();
    if (!ok) {
        throw new Error("Couldn’t load the payment gateway. Try again.");
    }
    const order = await paymentApi.create_order(
        input.amountInPaise,
        input.currency ?? "INR",
    );

    const instance = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: input.name ?? "Internity",
        description: input.description,
        prefill: input.prefill,
        theme: { color: "#ea580c" },
        modal: { ondismiss: input.onDismiss },
        handler: async (resp) => {
            try {
                await paymentApi.verify(resp);
                input.onSuccess?.();
            } catch {
                // verify failed — payment captured but signature mismatch
                console.error("Razorpay verify failed");
            }
        },
    });
    instance.on("payment.failed", (resp) => {
        console.error("Razorpay payment failed:", resp.error?.description);
    });
    instance.open();
}
