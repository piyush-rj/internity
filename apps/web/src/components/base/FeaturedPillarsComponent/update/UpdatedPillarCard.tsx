import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight } from "../icons";
import { ReactNode } from "react";


const cardVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
};


export default function UpdatedPillarCard({ heading, children, className }: { heading: string, children: ReactNode, className?: string }) {
    return (

        <motion.article
            variants={cardVariants}
            className={cn(
                "group relative flex flex-col overflow-hidden",
                "h-96 sm:h-110 rounded-xl",
                "border-[3px] border-neutral-800 bg-neutral-800",
                className,
            )}
        >
            {/* Top row */}
            <div className="grid grid-cols-5 gap-0.75">
                <div className="col-span-4 flex items-center px-6 rounded-xs bg-white">
                    <span className="text-4xl font-black tracking-tight text-black">
                        {heading}
                        <span className="text-[#DD6E49] ">.</span>
                    </span>
                </div>
                <div className="col-span-1 aspect-square bg-blue-200 rounded-xs flex justify-center items-center">
                    <a href="/home/internships" aria-label="Pick your interests">
                        <ArrowUpRight className="w-6 h-6" />
                    </a>
                </div>
            </div>

            <div className="relative flex-1 min-h-0">
            {children}
            </div>

        </motion.article>
    )
}