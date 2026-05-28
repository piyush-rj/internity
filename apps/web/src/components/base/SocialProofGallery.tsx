import Image from "next/image";
import { cn } from "@/src/lib/utils";

const STATS = [
    { value: "1,200+", label: "Startups hiring" },
    { value: "8,500+", label: "Students onboard" },
    { value: "30 days", label: "Avg time to hire" },
    { value: "100%", label: "Verified founders" },
];

// Big editorial banner with a single hero photo, an overlay title, and
// a floating stat strip pinned to the bottom of the image. Sits between
// the feature pillars and the listing sections.
export function SocialProofGallery() {
    return (
        <section className="relative bg-neutral-50">
            <div className="mx-auto max-w-6xl px-6 py-20">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-3xl ring-1 ring-black/5",
                        "aspect-[16/9] sm:aspect-[21/9]",
                    )}
                >
                    <Image
                        src="/platform-images/image5.png"
                        alt="Student celebrating after landing an internship"
                        fill
                        sizes="(min-width: 1024px) 1024px, 100vw"
                        priority
                        className="object-cover"
                    />
                    Legibility gradients — top for the title, bottom for stats
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"
                    />
                    <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
                        <div className="max-w-xl text-white">
                            <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-2.5 py-0.5 text-[11.5px] font-medium">
                                Built for the way startups hire today
                            </span>
                            <h2 className="mt-3 text-[30px] sm:text-[44px] leading-[1.05] font-semibold tracking-[-0.02em]">
                                Get your first paid internship.
                            </h2>
                            <p className="mt-3 text-[14px] sm:text-[15px] text-white/90 leading-relaxed max-w-md">
                                SpiderSkill is where motivated students meet
                                startups that actually hire them — verified,
                                direct, and without the noise of mass job
                                boards.
                            </p>
                        </div>

                        <dl
                            className={cn(
                                "self-stretch sm:self-start",
                                "rounded-2xl bg-white/85 backdrop-blur-md ring-1 ring-black/5",
                                "px-4 sm:px-6 py-4 sm:py-5",
                                "grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-10 gap-y-4",
                            )}
                        >
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                                        {s.label}
                                    </dt>
                                    <dd className="mt-0.5 text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                                        {s.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}
