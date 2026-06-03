"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    PiBriefcase,
    PiCalendarBlank,
    PiCheckCircleFill,
    PiSparkleFill,
} from "react-icons/pi";
import { NavBar } from "@/src/components/navbar/NavBar";
import { cn } from "@/src/lib/utils";
import { openCheckout } from "@/src/lib/razorpay";
import { useMe } from "@/src/hooks/useMe";
import type { PlanCode } from "@/src/lib/api/payment";

type Plan = {
    code: PlanCode;
    name: string;
    price: string;
    cadence: string;
    icon: React.ReactNode;
    features: string[];
    highlight?: boolean;
    badge?: string;
};

const PLANS: Plan[] = [
    {
        code: "PER_POST",
        name: "Per Post",
        price: "₹999",
        cadence: "one-time",
        icon: <PiBriefcase className="h-5 w-5" />,
        features: [
            "1 active internship or job listing",
            "Unlimited applicants",
            "Verified company badge",
            "30-day post duration",
            "Bring your own meeting links",
        ],
    },
    {
        code: "MONTHLY",
        name: "Monthly",
        price: "₹2,499",
        cadence: "per month",
        icon: <PiCalendarBlank className="h-5 w-5" />,
        features: [
            "Up to 10 active listings",
            "Unlimited applicants + bulk messaging",
            "Priority placement in search",
            "Team member invites",
            "Cancel anytime",
        ],
        highlight: true,
        badge: "Most popular",
    },
    {
        code: "YEARLY",
        name: "Yearly",
        price: "₹9,999",
        cadence: "per year",
        icon: <PiSparkleFill className="h-5 w-5" />,
        features: [
            "Unlimited active listings",
            "All Monthly features",
            "Save 67% vs Monthly (₹20k to ₹10k)",
            "Founder support (24h response)",
            "Coupons & referral credits",
        ],
    },
];

export default function PricingPage() {
    const { me } = useMe();
    const prefill = {
        name: me?.name ?? undefined,
        email: me?.email ?? undefined,
    };
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <TestPayButton prefill={prefill} />
            <main className="flex-1 pt-14">
                <div className="mx-auto max-w-5xl px-6 py-14">
                    <header className="text-center space-y-3 mb-12">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-[11.5px] font-medium">
                            For founders
                        </span>
                        <h1 className="text-[32px] font-semibold tracking-tight">
                            Simple pricing, no hidden tricks.
                        </h1>
                        <p className="text-[14px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Pick a plan that matches your hiring volume. Switch
                            or cancel any time — students always apply free.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {PLANS.map((p) => (
                            <PlanCard
                                key={p.code}
                                plan={p}
                                prefill={{
                                    name: me?.name ?? undefined,
                                    email: me?.email ?? undefined,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function PlanCard({
    plan,
    prefill,
}: {
    plan: Plan;
    prefill: { name?: string; email?: string };
}) {
    const [loading, setLoading] = useState(false);

    async function handlePay() {
        setLoading(true);
        try {
            await openCheckout({
                planCode: plan.code,
                prefill,
                onSuccess: () => {
                    toast.success(
                        `Payment successful! Welcome to ${plan.name}.`,
                    );
                },
                onDismiss: () => setLoading(false),
                onFailure: (msg) => {
                    toast.error(msg);
                    setLoading(false);
                },
            });
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Could not start payment.",
            );
            setLoading(false);
        }
    }

    return (
        <section
            className={cn(
                "relative rounded-2xl border bg-card p-6 flex flex-col",
                plan.highlight
                    ? "border-orange-300 shadow-lg shadow-orange-500/10 ring-1 ring-orange-200"
                    : "border-border",
            )}
        >
            {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-orange-500 text-white px-2.5 py-0.5 text-[10.5px] font-semibold">
                    {plan.badge}
                </span>
            )}
            <div className="flex items-center gap-2 text-orange-600">
                {plan.icon}
                <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                    {plan.name}
                </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[34px] font-semibold tracking-tight tabular-nums">
                    {plan.price}
                </span>
                <span className="text-[13px] text-muted-foreground">
                    {plan.cadence}
                </span>
            </div>
            <ul className="mt-5 space-y-2.5 text-[13px] flex-1">
                {plan.features.map((f) => (
                    <li
                        key={f}
                        className="flex items-start gap-2 leading-relaxed"
                    >
                        <PiCheckCircleFill className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-6">
                <button
                    type="button"
                    onClick={handlePay}
                    disabled={loading}
                    className={cn(
                        "w-full h-10 rounded-md text-[13px] font-medium transition-colors",
                        plan.highlight
                            ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-500/60"
                            : "border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-50",
                        loading && "cursor-not-allowed",
                    )}
                >
                    {loading ? "Opening…" : `Get ${plan.name}`}
                </button>
            </div>
        </section>
    );
}

function TestPayButton({
    prefill,
}: {
    prefill: { name?: string; email?: string };
}) {
    const [loading, setLoading] = useState(false);

    async function handleTest() {
        setLoading(true);
        try {
            await openCheckout({
                planCode: "TEST",
                prefill,
                onSuccess: () => {
                    toast.success("Test payment successful!");
                },
                onDismiss: () => {
                    setLoading(false);
                },
                onFailure: (msg) => {
                    toast.error(msg);
                    setLoading(false);
                },
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
            setLoading(false);
        }
    }

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <button
                type="button"
                onClick={handleTest}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-border bg-card shadow-lg px-4 py-3 text-[12.5px] font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                    ₹
                </span>
                {loading ? "Opening…" : "Test pay ₹10"}
            </button>
        </div>
    );
}
