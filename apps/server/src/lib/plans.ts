export const PLANS = {
    PRO: {
        code: "PRO",
        name: "Internity Pro",
        description:
            "Unlimited applications, priority support, mentor sessions",
        amount: 49900,
        currency: "INR",
    },
} as const;

export type PlanCode = keyof typeof PLANS;

export function isPlanCode(value: string): value is PlanCode {
    return value in PLANS;
}
