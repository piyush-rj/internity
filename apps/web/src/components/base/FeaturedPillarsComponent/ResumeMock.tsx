"use client";

import { motion, type Variants } from "framer-motion";
import { CheckGlyph } from "@/src/components/base/FeaturedPillarsComponent/icons";
import { cn } from "@/src/lib/utils";

export function ResumeMock() {
    const ringVariants: Variants = {
        hidden: { strokeDashoffset: 251 },
        show: {
            strokeDashoffset: 251 - 251 * 0.84,
            transition: { duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <div
            className={cn(
                "absolute inset-0",
                "mask-[linear-gradient(to_right,#000_72%,transparent_100%),linear-gradient(to_bottom,transparent_0%,#000_6%,#000_78%,transparent_100%)]",
                "mask-intersect [-webkit-mask-composite:source-in]",
            )}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.7,
                    delay: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                    "absolute left-0 top-2 w-[118%] overflow-hidden",
                    "rounded-lg border border-border bg-background",
                    "shadow-[0_30px_80px_-30px_rgba(15,23,42,0.28)]",
                )}
            >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-card">
                    <span className="ml-3 text-[10px] font-medium text-foreground">
                        Resume insights
                    </span>
                    <span
                        className={cn(
                            "rounded-md border border-brand/20 bg-brand-soft",
                            "px-1.5 py-0.5",
                            "text-[8px] font-medium text-brand",
                        )}
                    >
                        AI
                    </span>
                    <span className="ml-auto text-[9px] text-muted-foreground truncate">
                        piyush_resume.pdf
                    </span>
                </div>

                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative h-19 w-19 shrink-0">
                            <svg
                                viewBox="0 0 100 100"
                                className="h-full w-full -rotate-90"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="var(--border)"
                                    strokeWidth="9"
                                    fill="none"
                                />
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="var(--brand)"
                                    strokeWidth="9"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="251"
                                    variants={ringVariants}
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: true }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[19px] font-semibold leading-none tabular-nums">
                                    84
                                </span>
                                <span className="text-[8px] text-muted-foreground mt-0.5">
                                    score
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground">
                                Match for
                            </div>
                            <div className="text-[12px] font-medium text-foreground truncate">
                                Frontend Developer · Razorpay
                            </div>
                            <div
                                className={cn(
                                    "mt-1.5 inline-flex items-center gap-1",
                                    "rounded-md border border-emerald-200 bg-emerald-100",
                                    "px-1.5 py-0.5",
                                    "text-[9px] font-medium text-emerald-700",
                                )}
                            >
                                <CheckGlyph className="h-2.5 w-2.5" />
                                Strong fit · top 12%
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                            Skills match
                        </div>
                        <div className="space-y-2">
                            <SkillBar name="React" pct={95} delay={0.55} />
                            <SkillBar name="TypeScript" pct={82} delay={0.62} />
                            <SkillBar name="Node.js" pct={70} delay={0.69} />
                            <SkillBar name="SQL" pct={58} delay={0.76} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function SkillBar({
    name,
    pct,
    delay,
}: {
    name: string;
    pct: number;
    delay: number;
}) {
    return (
        <div className="flex items-center gap-2 text-[9px]">
            <span className="w-14 shrink-0 text-muted-foreground">{name}</span>
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{
                        duration: 0.85,
                        delay,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full bg-brand"
                />
            </div>
            <span className="w-7 text-right tabular-nums text-foreground font-medium">
                {pct}%
            </span>
        </div>
    );
}
