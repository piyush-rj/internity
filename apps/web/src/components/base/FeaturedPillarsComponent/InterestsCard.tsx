"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
    BarChart3,
    Bot,
    Code2,
    Megaphone,
    Palette,
    Target,
} from "lucide-react";
import { ArrowUpRight } from "@/src/components/base/FeaturedPillarsComponent/icons";
import { cn } from "@/src/lib/utils";

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
};

const INTERESTS = [
    { label: "Frontend", Icon: Code2 },
    { label: "Product", Icon: Target },
    { label: "Design", Icon: Palette },
    { label: "Data Science", Icon: BarChart3 },
    { label: "Marketing", Icon: Megaphone },
    { label: "AI / ML", Icon: Bot },
] as const;

// Full-bleed pillar card variant: the photo fills the card and the
// title, arrow, and interest chips all sit as overlays.
export function InterestsCard() {
    return (
        <motion.article
            variants={cardVariants}
            className={cn(
                "group relative flex h-110 flex-col overflow-hidden",
                "rounded-[28px] border border-border/70",
                "transition-colors duration-300",
            )}
        >
            <div aria-hidden className="absolute inset-0 bg-[#DD6E49]" />
            <div className="pointer-events-none absolute inset-x-0 top-28 bottom-28 z-0">
                {/* <Image
                    src="/platform-images/image7.png"
                    alt="Student picking their interests on SpiderSkill"
                    className="object-contain object-center p-8"
                    fill
                    unoptimized
                /> */}
            </div>

            <header className="relative z-10 flex items-start justify-between gap-3 p-7 sm:p-8">
                <h3
                    className={cn(
                        "text-[22px] sm:text-[22px]",
                        "leading-[1.02] tracking-[-0.018em]",
                        "max-w-[16ch] text-white",
                    )}
                >
                    <span className="font-semibold">Pick your interests,</span>{" "}
                    <span className="font-normal text-[15px] tracking-normal text-white/75">
                        and start applying in seconds.
                    </span>
                </h3>
                <a
                    href="#"
                    aria-label="Pick your interests"
                    className={cn(
                        "shrink-0 inline-flex h-9 w-9 items-center justify-center",
                        "rounded-[10px] bg-white/95 backdrop-blur-sm",
                        "text-foreground shadow-sm ring-1 ring-black/5",
                        "transition-colors hover:bg-white",
                    )}
                >
                    <ArrowUpRight className="h-4 w-4" />
                </a>
            </header>

            <div className="relative z-10 mt-auto p-5 sm:p-6">
                <div className="flex flex-wrap gap-1.5">
                    {INTERESTS.map((it, i) => {
                        const Icon = it.Icon;
                        return (
                            <span
                                key={it.label}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full",
                                    "bg-white/95 backdrop-blur-sm ring-1 ring-black/5",
                                    "px-2.5 py-1 text-[11.5px] font-medium text-foreground",
                                    "shadow-[0_4px_12px_-6px_rgba(15,23,42,0.4)]",
                                    // Highlight a couple of chips to suggest selection
                                    (i === 0 || i === 3) &&
                                        "bg-orange-500 text-white ring-orange-500/40",
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {it.label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </motion.article>
    );
}
