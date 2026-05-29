import { Announcement } from "@/src/components/base/HeroComponents/Announcement";
import { HeroSearch } from "@/src/components/base/HeroComponents/HeroSearch";
import { TabCard } from "@/src/components/base/HeroComponents/TabCard";

export function Hero() {
    return (
        <section className="relative isolate bg-neutral-50 overflow-hidden">
            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-20 text-center">
                <Announcement />
                <h1 className="mx-auto mt-6 sm:mt-8 max-w-3xl text-[34px] sm:text-[42px] lg:text-[45px] leading-[1.05] font-medium tracking-[-0.025em] text-foreground">
                    Turning caffeine into careers.
                </h1>
                <p className="mx-auto mt-4 sm:mt-5 max-w-136 text-[15px] sm:text-[17px] lg:text-[18px] tracking-[-0.25] text-neutral-600/95 font-medium leading-normal">
                    SpiderSkill is India&apos;s modern career platform for
                    students internships, full&#8209;time jobs and skill
                    trainings.
                </p>
                <HeroSearch />
                {/* <HeroCTAs /> */}
            </div>

            <TabCard />
        </section>
    );
}
