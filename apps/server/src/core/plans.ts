// plan catalogue for paid upgrades, amounts in smallest currency unit (paise)
export type Plan = {
    code: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
};

export const PLANS: Record<string, Plan> = {
    PER_POST: {
        code: "PER_POST",
        name: "Per Post",
        description: "1 active listing for 30 days",
        amount: 99900,
        currency: "INR",
    },
    MONTHLY: {
        code: "MONTHLY",
        name: "Monthly",
        description: "Up to 10 active listings, priority placement",
        amount: 249900,
        currency: "INR",
    },
    YEARLY: {
        code: "YEARLY",
        name: "Yearly",
        description: "Unlimited listings, all features, best value",
        amount: 999900,
        currency: "INR",
    },
    TEST: {
        code: "TEST",
        name: "Test Payment",
        description: "₹10 live mode test",
        amount: 1000,
        currency: "INR",
    },
};

export function isPlanCode(value: string): value is keyof typeof PLANS {
    return value in PLANS;
}
