"use client";
import { DashboardTabs } from "@/src/components/dashboard/DashboardTabs";
import { EmployerDashboard } from "@/src/components/dashboard/EmployerDashboard";
import { Greeting } from "@/src/components/dashboard/Greeting";
import { ProfileCompletion } from "@/src/components/dashboard/ProfileCompletion";
import { StatsRow } from "@/src/components/dashboard/StatsRow";
import { useMeStore } from "@/src/store/useMeStore";

export default function DashboardPage() {
    const role = useMeStore((s) => s.me?.role);

    if (role === "EMPLOYER") {
        return <EmployerDashboard />;
    }

    return (
        <div className="relative isolate">
            <div className="relative mx-auto max-w-6xl py-8 px-0 space-y-6">
                <Greeting />
                <StatsRow />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        <DashboardTabs />
                    </div>
                    <div className="space-y-4">
                        <ProfileCompletion />
                    </div>
                </div>
            </div>
        </div>
    );
}
