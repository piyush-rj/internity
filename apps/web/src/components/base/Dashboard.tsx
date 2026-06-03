import { TabCard } from "@/src/components/base/HeroComponents/TabCard";
import { SectionHeader } from "./SectionHeader";

export function Dashboard() {
    return (
        <section className="relative isolate bg-neutral-50 overflow-hidden pt-12 ">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHeader
                    title="Your whole internship search in one dashboard"
                    description="Track applications, saved roles, and interviews at a glance, watch your profile get stronger, and get internship recommendations matched to your skills."
                    cta={{
                        label: "Start hunting",
                        href: "/home/internships",
                    }}
                />
            </div>

            <TabCard />
        </section>
    );
}
