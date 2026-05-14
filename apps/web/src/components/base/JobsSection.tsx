import { BuildingIcon } from "@/src/components/base/icons";
import { SectionShell } from "@/src/components/base/SectionShell";
import { cn } from "@/src/lib/utils";

export function JobsSection() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const tracks = [
        { name: "Software Engineering", color: "bg-brand", start: 0, span: 4 },
        { name: "Product roles", color: "bg-violet-500", start: 1, span: 3 },
        {
            name: "Data & Analytics",
            color: "bg-emerald-500",
            start: 2,
            span: 4,
        },
        {
            name: "Sales & Business Dev",
            color: "bg-pink-500",
            start: 3,
            span: 3,
        },
        {
            name: "Operations & Supply Chain",
            color: "bg-orange-500",
            start: 0,
            span: 5,
        },
    ];
    return (
        <SectionShell
            eyebrow="Jobs for freshers"
            eyebrowIcon={<BuildingIcon className="h-3.5 w-3.5" />}
            eyebrowTone="blue"
            title="Get hired without prior experience"
            subtitle="Apply to entry-level full-time jobs that explicitly welcome freshers. See which companies are hiring across the year."
            cta={{ label: "Browse jobs", href: "#" }}
        >
            <div className="rounded-xl border border-black/8 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-8 mb-3 text-[11px] text-muted-foreground">
                    {months.map((m) => (
                        <div key={m} className="border-l border-black/5 pl-2">
                            {m}
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    {tracks.map((t) => (
                        <div
                            key={t.name}
                            className="grid grid-cols-8 items-center"
                        >
                            <div
                                className={cn(
                                    "h-7 rounded-md flex items-center px-2 text-[11px] font-medium text-white/95",
                                    t.color,
                                )}
                                style={{
                                    gridColumnStart: t.start + 1,
                                    gridColumnEnd: `span ${t.span}`,
                                }}
                            >
                                {t.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionShell>
    );
}
