"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { ArrowUpRight } from "@/src/components/base/FeaturedPillarsComponent/icons";

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
};

export function PillarCard({
    primary,
    secondary,
    children,
    className,
}: {
    primary: string;
    secondary: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.article
            variants={cardVariants}
            className={cn(
                "group relative flex h-110 flex-col overflow-hidden",
                "rounded-[28px] border border-border/70",
                "bg-secondary/40 p-7 sm:p-8",
                "transition-colors duration-300",
                className,
            )}
        >
            <header className="relative z-10 flex items-start justify-between gap-3">
                <h3
                    className={cn(
                        "text-[22px] sm:text-[22px]",
                        "leading-[1.02] tracking-[-0.018em]",
                        "max-w-[16ch] text-current",
                    )}
                >
                    <span className="font-semibold">{primary}</span>{" "}
                    <span className="font-normal text-[15px] tracking-normal text-current/70">
                        {secondary}
                    </span>
                </h3>
                <a
                    href="#"
                    aria-label={primary}
                    className={cn(
                        "shrink-0 inline-flex h-9 w-9 items-center justify-center",
                        "rounded-[10px] border border-border bg-background",
                        "text-foreground shadow-sm",
                        "transition-colors hover:bg-secondary",
                    )}
                >
                    <ArrowUpRight className="h-4 w-4" />
                </a>
            </header>
            <div className="relative mt-8 flex-1">{children}</div>
        </motion.article>
    );
}
