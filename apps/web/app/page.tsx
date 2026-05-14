import { CareerToolsSection } from "@/src/components/base/CareerToolsSection";
import { FeaturePillars } from "@/src/components/base/FeaturePillars";
import { FinalCTA } from "@/src/components/base/FinalCTA";
import { Footer } from "@/src/components/base/Footer";
import { Hero } from "@/src/components/base/Hero";
import { InternshipsSection } from "@/src/components/base/InternshipsSection";
import { JobsSection } from "@/src/components/base/JobsSection";
import { Testimonials } from "@/src/components/base/Testimonials";
import { NavBar } from "@/src/components/navbar/NavBar";

export default function Home() {
    return (
        <div className="relative flex flex-col flex-1 w-full overflow-x-clip bg-background">
            <PageRails />
            <NavBar />
            <main className="relative flex flex-col flex-1 w-full divide-y divide-border pt-14">
                <Hero />
                <FeaturePillars />
                <JobsSection />
                <InternshipsSection />
                <CareerToolsSection />
                <Testimonials />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
}

function PageRails() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-60 hidden md:block"
        >
            <div className="relative mx-auto h-full max-w-6xl">
                <div className="absolute inset-y-0 left-0 w-px bg-border" />
                <div className="absolute inset-y-0 right-0 w-px bg-border" />
            </div>
        </div>
    );
}
