"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type AppStatus = "Applied" | "Shortlisted" | "Interview" | "Offer";

type AppRow = {
    initial: string;
    bg: string;
    company: string;
    role: string;
    applied: string;
    status: AppStatus;
};

const apps: AppRow[] = [
    {
        initial: "R",
        bg: "bg-indigo-500",
        company: "Razorpay",
        role: "Frontend Intern",
        applied: "12 May",
        status: "Offer",
    },
    {
        initial: "Z",
        bg: "bg-red-500",
        company: "Zomato",
        role: "Product Intern",
        applied: "11 May",
        status: "Interview",
    },
    {
        initial: "S",
        bg: "bg-orange-500",
        company: "Swiggy",
        role: "Design Intern",
        applied: "10 May",
        status: "Shortlisted",
    },
    {
        initial: "C",
        bg: "bg-zinc-900",
        company: "CRED",
        role: "Growth Intern",
        applied: "9 May",
        status: "Applied",
    },
    {
        initial: "M",
        bg: "bg-pink-500",
        company: "Meesho",
        role: "Data Intern",
        applied: "8 May",
        status: "Shortlisted",
    },
    {
        initial: "P",
        bg: "bg-violet-500",
        company: "PhonePe",
        role: "Backend Intern",
        applied: "7 May",
        status: "Applied",
    },
    {
        initial: "F",
        bg: "bg-blue-500",
        company: "Flipkart",
        role: "Operations Intern",
        applied: "6 May",
        status: "Applied",
    },
    {
        initial: "U",
        bg: "bg-emerald-600",
        company: "Uber",
        role: "Analyst Intern",
        applied: "5 May",
        status: "Applied",
    },
];

const statusStyles: Record<AppStatus, string> = {
    Applied: "bg-muted text-muted-foreground border-border",
    Shortlisted: "bg-brand-soft text-brand border-brand/20",
    Interview: "bg-amber-100 text-amber-700 border-amber-200",
    Offer: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function UpdatedApplicationsMock() {
    const rowVariants: Variants = {
        hidden: { opacity: 0, x: -10 },
        show: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.45,
                delay: 0.3 + i * 0.06,
                ease: [0.22, 1, 0.36, 1],
            },
        }),
    };

    return (
        <div className="relative h-full bg-[#fcc03d] pt-8 pl-8 mt-0.75 ">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.65,
                    delay: 0.15,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                    "w-[125%] overflow-hidden",
                    "rounded-lg border border-border bg-background",
                    "shadow-[0_30px_70px_-30px_rgba(15,23,42,0.22)]",
                )}
            >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-card">
                    <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                    <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                    <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                    <div className="ml-3 flex items-center gap-1.5">
                        <SmallPill>All</SmallPill>
                        <SmallPill active>Active</SmallPill>
                        <SmallPill>Archived</SmallPill>
                    </div>
                    <span className="ml-auto text-[9px] text-muted-foreground tabular-nums">
                        {apps.length} applications
                    </span>
                </div>
                <div
                    className={cn(
                        "grid grid-cols-[1fr_auto_auto] gap-3",
                        "px-3 py-1.5",
                        "border-b border-border bg-secondary/40",
                        "text-[9px] uppercase tracking-wider text-muted-foreground",
                    )}
                >
                    <span>Company · Role</span>
                    <span>Applied</span>
                    <span>Status</span>
                </div>
                <ul>
                    {apps.map((a, i) => (
                        <motion.li
                            key={a.company}
                            custom={i}
                            variants={rowVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            className={cn(
                                "grid grid-cols-[auto_1fr_auto_auto] items-center gap-3",
                                "px-3 py-2.5",
                                "border-b border-border last:border-0",
                            )}
                        >
                            <span
                                className={cn(
                                    "h-7 w-7 rounded-md text-white text-[11px] font-semibold flex items-center justify-center shrink-0",
                                    a.bg,
                                )}
                            >
                                {a.initial}
                            </span>
                            <div className="min-w-0">
                                <div className="text-[12px] font-medium text-foreground truncate">
                                    {a.company}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                    {a.role}
                                </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                {a.applied}
                            </span>
                            <span
                                className={cn(
                                    "rounded-md border px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap",
                                    statusStyles[a.status],
                                )}
                            >
                                {a.status}
                            </span>
                        </motion.li>
                    ))}
                </ul>
            </motion.div>
        </div>
    );
}

function SmallPill({
    children,
    active,
}: {
    children: ReactNode;
    active?: boolean;
}) {
    return (
        <span
            className={cn(
                "rounded-md px-1.5 py-0.5 text-[9px] font-medium border",
                active
                    ? "bg-brand-soft text-brand border-brand/20"
                    : "bg-background text-muted-foreground border-border",
            )}
        >
            {children}
        </span>
    );
}
