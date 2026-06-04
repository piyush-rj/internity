export type Plan = {
    code: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    durationDays: number;
    listingLimit: number | null;
};

export const PLANS: Record<string, Plan> = {
    PER_POST: {
        code: "PER_POST",
        name: "Per Post",
        description: "1 active listing for 30 days",
        amount: 99900,
        currency: "INR",
        durationDays: 30,
        listingLimit: 1,
    },
    MONTHLY: {
        code: "MONTHLY",
        name: "Monthly",
        description: "Up to 10 active listings, priority placement",
        amount: 249900,
        currency: "INR",
        durationDays: 30,
        listingLimit: 10,
    },
    YEARLY: {
        code: "YEARLY",
        name: "Yearly",
        description: "Unlimited listings, all features, best value",
        amount: 999900,
        currency: "INR",
        durationDays: 365,
        listingLimit: null,
    },
};

export function isPlanCode(value: string): value is keyof typeof PLANS {
    return value in PLANS;
}
