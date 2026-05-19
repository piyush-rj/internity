/**
 * Plan catalogue for paid upgrades. Amounts are in the smallest currency unit
 * (paise for INR).
 */

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
