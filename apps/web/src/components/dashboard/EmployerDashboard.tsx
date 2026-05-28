"use client";

import { CompanySnapshot } from "@/src/components/dashboard/CompanySnapshot";
import { EmployerChartRow } from "@/src/components/dashboard/EmployerChartRow";
import { Greeting } from "@/src/components/dashboard/Greeting";
import { ListingLifecycleBanner } from "@/src/components/dashboard/ListingLifecycleBanner";
import { MyListingsWidget } from "@/src/components/dashboard/MyListingsWidget";

export function EmployerDashboard() {
    return (
        <div className="relative isolate">
            <div className="relative mx-auto max-w-6xl px-0 py-6 space-y-6">
                <Greeting />
                <ListingLifecycleBanner />
                <EmployerChartRow />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        <MyListingsWidget />
                    </div>
                    <div className="space-y-4">
                        <CompanySnapshot />
                    </div>
                </div>
            </div>
        </div>
    );
}
