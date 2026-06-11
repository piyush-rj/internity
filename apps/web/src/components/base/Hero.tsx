import Image from "next/image";
import { Announcement } from "./HeroComponents/Announcement";
import { HeroSearch } from "./HeroComponents/HeroSearch";

export function Hero() {
    return (
        <section className="bg-neutral-50">
            {/* The photo is bounded by the page rails (max-w-6xl) rather than
                bleeding full-width. */}
            <div className="relative mx-auto max-w-6xl bg-neutral-900 rounded-3xl">
                {/* Clip layer: zooms the photo in and shifts the subject right.
                    The scale gives headroom so the translate never reveals an
                    edge; overflow-hidden keeps the zoom inside the rails without
                    clipping the search dropdown (which lives in the layer
                    below). */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <Image
                        src="/platform-images/image5.png"
                        alt="Student celebrating after landing an internship"
                        fill
                        priority
                        sizes="(min-width: 1152px) 1152px, 100vw"
                        className="object-cover object-center scale-130 translate-x-[12%] -translate-y-10 rounded-3xl"
                    />
                    {/* Legibility scrims: darker on the left (under the text)
                        fading to clear on the right, plus soft top/bottom edges.
                        Keeps the subject's face uncovered. */}
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-transparent"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-black/35"
                    />
                </div>

                {/* On mobile the text/badge stay at the top while the search is
                    pushed to the bottom (justify-between), with vertical padding
                    so neither sticks to an edge. On larger screens it collapses
                    back to a normal block, centred vertically; the narrow column
                    keeps it clear of the subject on the right. */}
                <div className="relative z-10 px-4 sm:px-8">
                    <div className="flex min-h-140 items-stretch py-12 sm:min-h-160 sm:items-center sm:py-0 lg:min-h-175">
                        <div className="max-w-xl text-left flex flex-col justify-between sm:block">
                            <div>
                                <Announcement />
                                <h1 className="mt-6 sm:mt-8 text-[34px] sm:text-[42px] lg:text-[45px] leading-[1.05] font-medium tracking-tight text-white">
                                    Land your paid internship in 15 days
                                </h1>
                                <p className="mt-4 sm:mt-5 max-w-md text-[15px] sm:text-[17px] lg:text-[18px] tracking-[-0.25] font-medium leading-normal text-white/85">
                                    SpiderSkill is India&apos;s modern
                                    internship platform, where students land
                                    real internships at vetted startups.
                                </p>
                            </div>
                            <HeroSearch />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
