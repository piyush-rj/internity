"use client";

import { motion, type Variants } from "framer-motion";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import { SectionHeader } from "@/src/components/base/SectionHeader";
import { ApplicationsMock } from "@/src/components/base/FeaturedPillarsComponent/ApplicationsMock";
import { IntegrationsMock } from "@/src/components/base/FeaturedPillarsComponent/IntegrationsMock";
import { InterestsCard } from "@/src/components/base/FeaturedPillarsComponent/InterestsCard";
import { PillarCard } from "@/src/components/base/FeaturedPillarsComponent/PillarCard";

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export function FeaturePillars() {
    return (
        <section className="relative bg-neutral-50">
            <SectionFrame className="px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
                <SectionHeader
                    title="Everything you need to land your next role"
                    description="Smart applications, AI resume coaching, and 200+ partner companies — all in one place."
                    cta={{ label: "Explore internships", href: "/home/internships" }}
                />
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
                >
                    <InterestsCard />
                    <PillarCard
                        className="bg-[#fcc03d] text-neutral-900"
                        primary="Smart applications"
                        secondary="that recruiters actually open."
                    >
                        <ApplicationsMock />
                    </PillarCard>
                    <PillarCard
                        className="bg-[#628FFA] text-white"
                        primary="200+ companies"
                        secondary="actively hiring on spiderskill."
                    >
                        <IntegrationsMock />
                    </PillarCard>
                </motion.div>
            </SectionFrame>
        </section>
    );
}
