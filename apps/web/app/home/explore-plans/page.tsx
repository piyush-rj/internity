"use client";

import { PlanGrid } from "@/src/components/plans/PlanCards";
import { useMe } from "@/src/hooks/useMe";

export default function ExplorePlansPage() {
    const { me } = useMe();
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

            <PlanGrid
                prefill={{
                    name: me?.name ?? undefined,
                    email: me?.email ?? undefined,
                }}
                companyId={me?.activeCompanyId ?? null}
            />
        </div>
    );
}
