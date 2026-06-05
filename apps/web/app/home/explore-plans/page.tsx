"use client";

import { useState } from "react";
import { PlanGrid, type CouponDiscount } from "@/src/components/plans/PlanCards";
import { paymentApi } from "@/src/lib/api/payment";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { X } from "lucide-react";

export default function ExplorePlansPage() {
    const { me } = useMe();
    const [couponInput, setCouponInput] = useState("");
    const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
    const [discounts, setDiscounts] = useState<
        Record<string, CouponDiscount> | undefined
    >(undefined);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);

    async function handleApplyCoupon(e: React.FormEvent) {
        e.preventDefault();
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponError(null);
        setValidating(true);
        try {
            const res = await paymentApi.validate_coupon({ code });
            setAppliedCode(res.code);
            setDiscounts(res.discounts as Record<string, CouponDiscount>);
        } catch (err) {
            setCouponError(
                err instanceof ApiClientError ? err.message : "Invalid coupon code.",
            );
        } finally {
            setValidating(false);
        }
    }

    function clearCoupon() {
        setCouponInput("");
        setAppliedCode(undefined);
        setDiscounts(undefined);
        setCouponError(null);
    }

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <header className="text-center space-y-3 mb-12">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-[11.5px] font-medium">
                    For founders
                </span>
                <h1 className="text-[32px] font-semibold tracking-tight">
                    Simple pricing, no hidden tricks.
                </h1>
                <p className="text-[14px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Pick a plan that matches your hiring volume. Switch or
                    cancel any time — students always apply free.
                </p>
            </header>

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
                        className="flex items-center gap-2"
                    >
                        <input
                            value={couponInput}
                            onChange={(e) =>
                                setCouponInput(
                                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                                )
                            }
                            placeholder="Have a coupon code?"
                            className="h-9 w-52 rounded-lg border border-border bg-background px-3 text-[12.5px] font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                            type="submit"
                            disabled={!couponInput || validating}
                            className="h-9 px-4 rounded-lg border border-border bg-background text-[12.5px] font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                            {validating ? "Checking…" : "Apply"}
                        </button>
                        {couponError && (
                            <span className="text-[12px] text-destructive">{couponError}</span>
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
                couponCode={appliedCode}
                discounts={discounts}
            />
        </div>
    );
}
