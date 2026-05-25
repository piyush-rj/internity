// plan catalogue for paid upgrades, amounts in smallest currency unit
export type Plan = {
    code: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
};

export const PLANS: Record<string, Plan> = {
    PRO: {
        code: "PRO",
        name: "Internity Pro",
        description:
            "Unlimited applications, priority support, mentor sessions",
        amount: 49900,
        currency: "INR",
    },
};

export function isPlanCode(value: string): value is keyof typeof PLANS {
    return value in PLANS;
}
