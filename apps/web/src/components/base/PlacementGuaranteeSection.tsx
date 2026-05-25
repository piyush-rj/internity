import { CheckIcon } from "@/src/components/base/icons";
import { SectionShell } from "@/src/components/base/SectionShell";
import { cn } from "@/src/lib/utils";

export function PlacementGuaranteeSection() {
    return (
        <SectionShell
            title="Land a job or get your money back"
            subtitle="Our flagship 6-month program prepares you for placements. If you don't get a job within 6 months of finishing, we refund your fees."
            cta={{ label: "Learn more", href: "#" }}
        >
            <div className="rounded-lg border border-black/8 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-black/5 px-5 py-3 text-[12px]">
                    <span className="font-mono text-muted-foreground">
                        PG-2024
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span>Software Development &amp; Data Science tracks</span>
                    <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] bg-success/10 text-success">
                        94% placement rate
                    </span>
                </div>
                <div className="grid md:grid-cols-3 text-[12px]">
                    <PgPane
                        title="Before — Self-study"
                        lines={[
                            {
                                kind: "del",
                                text: "Random YouTube playlists, no structure",
                            },
                            { kind: "del", text: "No portfolio projects" },
                            {
                                kind: "del",
                                text: "No mock interviews or feedback",
                            },
                            {
                                kind: "del",
                                text: "Cold-applying with no callbacks",
                            },
                        ]}
                    />
                    <PgPane
                        title="With Placement Guarantee"
                        lines={[
                            {
                                kind: "add",
                                text: "Structured 24-week curriculum",
                            },
                            {
                                kind: "add",
                                text: "5 portfolio projects with real datasets",
                            },
                            {
                                kind: "add",
                                text: "Weekly mock interviews + feedback",
                            },
                            {
                                kind: "add",
                                text: "Direct referrals to 200+ hiring partners",
                            },
                        ]}
                        highlight
                    />
                    <PgPane
                        title="Outcomes"
                        lines={[
                            { kind: "ctx", text: "Avg starting CTC: ₹6.8 LPA" },
                            { kind: "ctx", text: "Top CTC offered: ₹22 LPA" },
                            {
                                kind: "ctx",
                                text: "Median time to offer: 11 weeks",
                            },
                            {
                                kind: "ctx",
                                text: "Refund clause if no job in 6 months",
                            },
                        ]}
                    />
                </div>
            </div>
        </SectionShell>
    );
}

function PgPane({
    title,
    lines,
    highlight,
}: {
    title: string;
    lines: { kind: "ctx" | "add" | "del"; text: string }[];
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                "border-r border-black/5 last:border-r-0",
                highlight && "bg-brand-soft/40",
            )}
        >
            <div className="px-5 py-3 text-[11px] text-muted-foreground border-b border-black/5 font-medium">
                {title}
            </div>
            <div className="p-5 space-y-2">
                {lines.map((l, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-2",
                            l.kind === "add"
                                ? "text-success"
                                : l.kind === "del"
                                  ? "text-red-500"
                                  : "text-foreground",
                        )}
                    >
                        <span className="shrink-0 mt-0.5">
                            {l.kind === "add" ? (
                                <CheckIcon className="h-3.5 w-3.5" />
                            ) : l.kind === "del" ? (
                                <span className="text-[14px] leading-none">
                                    ×
                                </span>
                            ) : (
                                <span className="text-muted-foreground">•</span>
                            )}
                        </span>
                        <span>{l.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
