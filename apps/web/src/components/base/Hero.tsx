import { Announcement } from "@/src/components/base/HeroComponents/Announcement";
import { HeroCTAs } from "@/src/components/base/HeroComponents/HeroCTAs";
import { HeroSearch } from "@/src/components/base/HeroComponents/HeroSearch";
import { TabCard } from "@/src/components/base/HeroComponents/TabCard";

export function Hero() {
    return (
        <section className="relative isolate bg-neutral-50 overflow-hidden">
            <div className="relative mx-auto max-w-6xl px-6 pt-20 sm:pt-20 pb-20 text-center">
                <Announcement />
                <h1 className="mx-auto mt-8 max-w-3xl text-[44px] sm:text-[45px] leading-[1.04] font-medium tracking-[-0.025em] text-foreground">
                    Turning caffeine into careers.
                </h1>
                <p className="mx-auto mt-5 max-w-136 text-[17px] sm:text-[18px] tracking-[-0.25] text-neutral-600/95 font-medium leading-normal">
                    Internity is India&apos;s modern career platform for
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
