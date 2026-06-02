"use client";

import { cn } from "@/src/lib/utils";
import { ArrowUpRight } from "../icons";
import {
    BarChart3,
    Bot,
    Code2,
    Megaphone,
    Palette,
    Target,
} from "lucide-react";
import { animate, motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

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

const PROGRESS = 100;

export function UpdatedInterestsCard() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const controls = animate(0, PROGRESS, {
            duration: (PROGRESS / 100) * 6,
            ease: "linear",
            onUpdate: (v) => setCount(Math.round(v)),
        });
        return controls.stop;
    }, []);

    return (
        <div className="h-full grid grid-cols-3 flex-1 min-h-0 gap-0.75 mt-0.75">
            <div className="col-span-1 relative rounded-xs overflow-hidden">
                <div
                    className="absolute inset-0 bg-neutral-900"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                                -45deg,
                                transparent 0px,
                                transparent 6px,
                                #ea580c 5px,
                                #ea580c 7px
                            )`,
                    }}
                />
                {/* Animated orange fill rising from the bottom */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-[#DD6E49]"
                    initial={{ height: "0%" }}
                    animate={{ height: `${PROGRESS}%` }}
                    transition={{
                        duration: (PROGRESS / 100) * 6,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Interests list */}
            <div className="col-span-2 flex flex-col items-center gap-y-0.5 rounded-xs overflow-hidden">
                {INTERESTS.map((it) => {
                    const Icon = it.Icon;
                    return (
                        <div
                            key={it.label}
                            className={cn(
                                "w-full flex justify-start items-center gap-x-2",
                                "px-3 py-2",
                                "bg-white rounded-xs",
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {it.label}
                        </div>
                    );
                })}
                <div className="h-full w-full flex justify-center items-center text-6xl font-black text-white leading-none">
                    {count}%
                </div>
            </div>
        </div>
    );
}
