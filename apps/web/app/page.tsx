import { FeaturePillars } from "@/src/components/base/FeaturePillars";
import { Footer } from "@/src/components/base/Footer";
import { Hero } from "@/src/components/base/Hero";
import { InternshipsSection } from "@/src/components/base/InternshipsSection";
import { JobsSection } from "@/src/components/base/JobsSection";
import { NavBar } from "@/src/components/navbar/NavBar";
import { cn } from "@/src/lib/utils";

export default function Home() {
    return (
        <div className="relative flex flex-col flex-1 w-full overflow-x-clip bg-neutral-50">
            <PageRails />
            <NavBar floatOnScroll />
            <main className="relative flex flex-col flex-1 w-full pt-14">
                <SectionWrap first>
                    <Hero />
                </SectionWrap>
                <SectionWrap>
                    <FeaturePillars />
                </SectionWrap>
                <SectionWrap>
                    <JobsSection />
                </SectionWrap>
                <SectionWrap>
                    <InternshipsSection />
                </SectionWrap>
                {/* <SectionWrap>
                    <CareerToolsSection />
                </SectionWrap> */}
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

function SectionWrap({
    children,
    first,
}: {
    children: React.ReactNode;
    first?: boolean;
}) {
    return (
        <div className={cn("relative", !first && "border-t border-border")}>
            {!first && <RailIntersection />}
            {children}
        </div>
    );
}

function RailIntersection() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-70 hidden md:block"
        >
            <div className="relative mx-auto max-w-6xl h-0">
                <PlusMark className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
                <PlusMark className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
    );
}

function PlusMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex h-5 w-5 items-center justify-center bg-neutral-50",
                className,
            )}
        >
            <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="#00000040"
                strokeWidth="1"
                strokeLinecap="round"
                className="h-4 w-4 text-border"
            >
                <path d="M6 1v10M1 6h10" />
            </svg>
        </span>
    );
}
