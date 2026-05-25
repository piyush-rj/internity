"use client";

import { useCallback, useEffect, useState } from "react";
import {
    PiBriefcaseFill,
    PiFileTextFill,
    PiGraduationCapFill,
    PiUsersThreeFill,
} from "react-icons/pi";
import { adminApi, type AdminPlatformStats } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<AdminPlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            setStats(await adminApi.get_stats());
        } catch (err) {
            setErrorMessage(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load platform stats.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    return (
        <section className="px-6 py-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-[18px] font-semibold tracking-tight">
                    Platform overview
                </h1>
                <p className="text-[12.5px] text-muted-foreground">
                    A snapshot of SpiderSkill right now.
                </p>
            </header>

            {errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive max-w-md">
                    {errorMessage}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        label="Students"
                        value={stats?.totalStudents}
                        loading={loading}
                        icon={PiGraduationCapFill}
                        tone="stone"
                    />
                    <StatCard
                        label="Founders"
                        value={stats?.totalFounders}
                        loading={loading}
                        icon={PiUsersThreeFill}
                        tone="zinc"
                    />
                    <StatCard
                        label="Live listings"
                        value={stats?.totalLiveListings}
                        loading={loading}
                        icon={PiBriefcaseFill}
                        tone="brand"
                    />
                    <StatCard
                        label="Applications today"
                        value={stats?.applicationsToday}
                        loading={loading}
                        icon={PiFileTextFill}
                        tone="stone"
                    />
                </div>
            )}
        </section>
    );
}

function StatCard({
    label,
    value,
    loading,
    icon: Icon,
    tone = "stone",
}: {
    label: string;
    value: number | undefined;
    loading: boolean;
    icon: React.ComponentType<{ className?: string }>;
    tone?: "stone" | "zinc" | "brand";
}) {
    const surface =
        tone === "brand"
            ? "border-orange-200 bg-brand-soft"
            : tone === "zinc"
              ? "border-zinc-200 bg-zinc-50"
              : "border-stone-200 bg-stone-50";
    const iconWrap =
        tone === "brand"
            ? "ring-orange-200 bg-white text-orange-700"
            : "ring-border/70 bg-white text-foreground/70";
    return (
        <div
            className={cn(
                "rounded-lg border px-4 py-3.5 shadow-xs",
                surface,
            )}
        >
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg ring-1 shrink-0",
                        iconWrap,
                    )}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                    </div>
                    <div className="mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums leading-none">
                        {loading ? "—" : (value ?? 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
