"use client";

import { motion, type Variants } from "framer-motion";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import { SectionHeader } from "@/src/components/base/SectionHeader";
import { SlidersIcon } from "@/src/components/base/icons";
import { ApplicationsMock } from "@/src/components/base/FeaturedPillarsComponent/ApplicationsMock";
import { IntegrationsMock } from "@/src/components/base/FeaturedPillarsComponent/IntegrationsMock";
import { PillarCard } from "@/src/components/base/FeaturedPillarsComponent/PillarCard";
import { ResumeMock } from "@/src/components/base/FeaturedPillarsComponent/ResumeMock";

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export function FeaturePillars() {
    return (
        <section className="relative bg-background">
            <SectionFrame className="px-10 py-20 sm:py-24">
                <SectionHeader
                    eyebrow={{
                        icon: <SlidersIcon className="h-3.5 w-3.5" />,
                        label: "Platform",
                        tone: "pink",
                    }}
                    title="Everything you need to land your next role"
                    description="Smart applications, AI resume coaching, and 200+ partner companies — all in one place."
                    cta={{ label: "Explore features", href: "#" }}
                />
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
                >
                    <PillarCard
                        primary="Smart applications"
                        secondary="that recruiters actually open."
                    >
                        <ApplicationsMock />
                    </PillarCard>
                    <PillarCard
                        primary="AI resume builder"
                        secondary="that lands you the interview."
                    >
                        <ResumeMock />
                    </PillarCard>
                    <PillarCard
                        primary="200+ companies"
                        secondary="actively hiring on Internity."
                    >
                        <IntegrationsMock />
                    </PillarCard>
                </motion.div>
            </SectionFrame>
        </section>
    );
}
