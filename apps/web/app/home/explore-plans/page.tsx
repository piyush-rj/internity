"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PiSparkleFill } from "react-icons/pi";
import { PlanGrid, type CouponDiscount } from "@/src/components/plans/PlanCards";
import { paymentApi } from "@/src/lib/api/payment";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { PLANS } from "@/src/components/plans/PlanCards";

const COUPON_ERROR_MESSAGES: Record<string, string> = {
    COUPON_NOT_FOUND: "No coupon found with that code. Double-check and try again.",
    INVALID_COUPON:   "No coupon found with that code. Double-check and try again.",
    COUPON_EXPIRED:   "This coupon has expired and can no longer be applied.",
    COUPON_REVOKED:   "This coupon has been revoked and is no longer valid.",
    COUPON_ALREADY_USED: "You've already used this coupon — it's single-use per account.",
    ALREADY_USED:     "You've already used this coupon — it's single-use per account.",
};

function couponErrorMessage(err: unknown): string {
    if (err instanceof ApiClientError) {
        return COUPON_ERROR_MESSAGES[err.code] ?? err.message ?? "Invalid coupon code.";
    }
    return "Invalid coupon code.";
}

type ActiveOffer = {
    id: string;
    title: string;
    description: string | null;
    discountPctPerPost: number;
    discountPctMonthly: number;
    discountPctYearly: number;
    expiresAt: string;
};

function offerToDiscounts(
    offer: ActiveOffer,
): Record<string, CouponDiscount> {
    function discounted(original: number, pct: number) {
        return Math.round(original * (1 - pct / 100));
    }
    const perPostPlan = PLANS.find((p) => p.code === "PER_POST");
    const monthlyPlan = PLANS.find((p) => p.code === "MONTHLY");
    const yearlyPlan = PLANS.find((p) => p.code === "YEARLY");

    // Amounts in paise (same as server PLANS config)
    const amounts: Record<string, number> = {
        PER_POST: 99900,
        MONTHLY: 249900,
        YEARLY: 999900,
    };
    void perPostPlan; void monthlyPlan; void yearlyPlan;

    return {
        PER_POST: {
            pct: offer.discountPctPerPost,
            originalAmount: amounts.PER_POST!,
            discountedAmount: discounted(amounts.PER_POST!, offer.discountPctPerPost),
        },
        MONTHLY: {
            pct: offer.discountPctMonthly,
            originalAmount: amounts.MONTHLY!,
            discountedAmount: discounted(amounts.MONTHLY!, offer.discountPctMonthly),
        },
        YEARLY: {
            pct: offer.discountPctYearly,
            originalAmount: amounts.YEARLY!,
            discountedAmount: discounted(amounts.YEARLY!, offer.discountPctYearly),
        },
    };
}

export default function ExplorePlansPage() {
    const { me } = useMe();
    const [offer, setOffer] = useState<ActiveOffer | null>(null);
    const [offerDismissed, setOfferDismissed] = useState(false);

    // Coupon state (manual entry, overrides offer discounts)
    const [couponInput, setCouponInput] = useState("");
    const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
    const [couponDiscounts, setCouponDiscounts] = useState<
        Record<string, CouponDiscount> | undefined
    >(undefined);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);

    // Fetch active offer on mount
    useEffect(() => {
        paymentApi
            .get_active_offer()
            .then((res) => setOffer(res.offer))
            .catch(() => {});
    }, []);

    async function handleApplyCoupon(e: React.FormEvent) {
        e.preventDefault();
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponError(null);
        setValidating(true);
        try {
            const res = await paymentApi.validate_coupon({ code });
            setAppliedCode(res.code);
            setCouponDiscounts(res.discounts as Record<string, CouponDiscount>);
        } catch (err) {
            setCouponError(couponErrorMessage(err));
        } finally {
            setValidating(false);
        }
    }

    function clearCoupon() {
        setCouponInput("");
        setAppliedCode(undefined);
        setCouponDiscounts(undefined);
        setCouponError(null);
    }

    // Coupon discounts take priority over the offer
    const activeDiscounts =
        couponDiscounts ?? (offer && !offerDismissed ? offerToDiscounts(offer) : undefined);
    const activeCouponCode = appliedCode;

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
            <header className="text-center space-y-3 mb-10 sm:mb-12">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-[11.5px] font-medium">
                    For founders
                </span>
                <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight">
                    Simple pricing, no hidden tricks.
                </h1>
                <p className="text-[14px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Pick a plan that matches your hiring volume. Switch or
                    cancel any time — students always apply free.
                </p>
            </header>

            {/* Active offer banner */}
            {offer && !offerDismissed && !appliedCode && (
                <div className="mb-8 rounded-xl border border-orange-200 bg-orange-50 px-4 sm:px-5 py-3.5 flex items-start gap-3">
                    <PiSparkleFill className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-orange-800">
                            {offer.title}
                        </p>
                        {offer.description && (
                            <p className="mt-0.5 text-[12px] text-orange-700/80">
                                {offer.description}
                            </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-orange-600">
                            Expires {new Date(offer.expiresAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOfferDismissed(true)}
                        className="shrink-0 text-orange-400 hover:text-orange-600 transition-colors mt-0.5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Coupon input */}
            <div className="mb-8 flex justify-center">
                {appliedCode ? (
                    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
                        <span className="text-[12.5px] font-semibold text-emerald-700 font-mono">
                            {appliedCode}
                        </span>
                        <span className="text-[12px] text-emerald-600">applied</span>
                        <button
                            type="button"
                            onClick={clearCoupon}
                            className="ml-1 text-emerald-500 hover:text-emerald-700 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleApplyCoupon}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
                    >
                        <input
                            value={couponInput}
                            onChange={(e) =>
                                setCouponInput(
                                    e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, ""),
                                )
                            }
                            placeholder="Have a coupon code?"
                            className="h-9 w-full sm:w-52 rounded-lg border border-border bg-background px-3 text-[12.5px] font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                            type="submit"
                            disabled={!couponInput || validating}
                            className="h-9 px-4 rounded-lg border border-border bg-background text-[12.5px] font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                            {validating ? "Checking…" : "Apply"}
                        </button>
                        {couponError && (
                            <span className="text-[12px] text-destructive text-center sm:text-left">
                                {couponError}
                            </span>
                        )}
                    </form>
                )}
            </div>

            <PlanGrid
                prefill={{
                    name: me?.name ?? undefined,
                    email: me?.email ?? undefined,
                }}
                companyId={me?.activeCompanyId ?? null}
                couponCode={activeCouponCode}
                discounts={activeDiscounts}
            />
        </div>
    );
}
