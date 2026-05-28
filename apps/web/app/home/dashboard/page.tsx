"use client";
import { DashboardTabs } from "@/src/components/dashboard/DashboardTabs";
import { EmployerDashboard } from "@/src/components/dashboard/EmployerDashboard";
import { Greeting } from "@/src/components/dashboard/Greeting";
import { ProfileCompletion } from "@/src/components/dashboard/ProfileCompletion";
import { StatsChartRow } from "@/src/components/dashboard/StatsChartRow";
import { useMeStore } from "@/src/store/useMeStore";

export default function DashboardPage() {
    const role = useMeStore((s) => s.me?.role);
    const initialized = useMeStore((s) => s.initialized);

    // Until /auth/me resolves we don't know which dashboard to render. Show
    // a neutral skeleton instead of guessing the student layout (which then
    // visibly swaps to the employer one once `me` loads).
    if (!initialized) {
        return <DashboardSkeleton />;
    }

    if (role === "EMPLOYER") {
        return <EmployerDashboard />;
    }

    return (
        <div className="relative isolate">
            <div className="relative mx-auto max-w-6xl py-6 sm:py-8 px-4 sm:px-6 space-y-5 sm:space-y-6">
                <Greeting />
                <StatsChartRow />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4 min-w-0">
                        <DashboardTabs />
                    </div>
                    <div className="space-y-4 min-w-0">
                        <ProfileCompletion />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="relative isolate">
            <div className="relative mx-auto max-w-6xl py-6 sm:py-8 px-4 sm:px-6 space-y-5 sm:space-y-6 animate-pulse">
                <div className="flex items-end justify-between gap-3 mb-6">
                    <div className="h-7 w-64 rounded-md bg-secondary" />
                    <div className="h-4 w-32 rounded-md bg-secondary" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-border bg-card px-5 py-4 h-23"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-secondary shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-24 rounded-full bg-secondary" />
                                    <div className="h-5 w-12 rounded-md bg-secondary" />
                                    <div className="h-2.5 w-32 rounded-full bg-secondary" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-lg border border-border bg-card h-72" />
                    <div className="rounded-lg border border-border bg-card h-72" />
                </div>
            </div>
        </div>
    );
}
