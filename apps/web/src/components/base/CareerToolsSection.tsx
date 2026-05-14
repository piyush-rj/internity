import type { ReactNode } from "react";
import { SlidersIcon } from "@/src/components/base/icons";
import { SectionShell } from "@/src/components/base/SectionShell";
import { cn } from "@/src/lib/utils";

export function CareerToolsSection() {
    return (
        <SectionShell
            eyebrow="Career toolkit"
            eyebrowIcon={<SlidersIcon className="h-3.5 w-3.5" />}
            eyebrowTone="amber"
            title="Everything you need to land the offer"
            subtitle="Resume reviews, AI-powered cover letters, and interview prep — all included with your free account."
            cta={{ label: "Explore tools", href: "#" }}
        >
            <div className="grid md:grid-cols-3 gap-3">
                <StatCard
                    label="Active learners"
                    value="2.1Cr"
                    delta="+18% YoY"
                    chart={
                        <BarChart
                            values={[
                                40, 55, 48, 62, 58, 72, 80, 76, 84, 92, 88, 96,
                            ]}
                            color="bg-brand"
                        />
                    }
                />
                <StatCard
                    label="Avg time to first offer"
                    value="32 days"
                    delta="-21% YoY"
                    chart={
                        <LineChart
                            values={[
                                60, 56, 52, 49, 47, 44, 42, 40, 38, 36, 34, 32,
                            ]}
                        />
                    }
                />
                <StatCard
                    label="Companies actively hiring"
                    value="2L+"
                    delta="+24% YoY"
                    chart={
                        <BarChart
                            values={[
                                12, 18, 22, 25, 28, 30, 32, 35, 36, 38, 40, 42,
                            ]}
                            color="bg-success"
                        />
                    }
                />
            </div>
        </SectionShell>
    );
}

function StatCard({
    label,
    value,
    delta,
    chart,
}: {
    label: string;
    value: string;
    delta: string;
    chart: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <div className="text-[12px] text-muted-foreground">{label}</div>
            <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[28px] font-semibold tracking-tight">
                    {value}
                </span>
                <span className="text-[11px] text-success">{delta}</span>
            </div>
            <div className="mt-4 h-20">{chart}</div>
        </div>
    );
}

function BarChart({ values, color }: { values: number[]; color: string }) {
    const max = Math.max(...values);
    return (
        <div className="flex items-end gap-1 h-full">
            {values.map((v, i) => (
                <div
                    key={i}
                    className={cn("flex-1 rounded-sm opacity-80", color)}
                    style={{ height: `${(v / max) * 100}%` }}
                />
            ))}
        </div>
    );
}

function LineChart({ values }: { values: number[] }) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 100 - ((v - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
        >
            <polyline
                points={points}
                fill="none"
                stroke="rgb(0, 139, 220)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
