import { SectionFrame } from "@/src/components/base/SectionFrame";
import { SectionHeader } from "@/src/components/base/SectionHeader";
import { cn } from "@/src/lib/utils";

export function Testimonials() {
    const quotes = [
        {
            q: "I landed my first internship at a fintech startup within two weeks of applying through Internity. The filters made it really easy to find work-from-home roles that matched my class schedule.",
            a: "Aanya Sharma",
            r: "B.Tech CSE, Delhi · Now at Razorpay",
            grad: "from-pink-500 to-violet-500",
        },
        {
            q: "The Digital Marketing training was the turning point. I built a portfolio I was actually proud to share, and three offers came in within a month of finishing.",
            a: "Rohan Iyer",
            r: "BBA, Pune · Now at Swiggy",
            grad: "from-emerald-400 to-sky-500",
        },
        {
            q: "I came from a tier-3 college and didn't think I had a shot at product roles. The placement guarantee program changed that — mock interviews every week were the missing piece.",
            a: "Priya Nair",
            r: "BCA, Kochi · Now at Meesho",
            grad: "from-orange-400 to-red-500",
        },
    ];
    return (
        <section className="bg-surface">
            <SectionFrame className="px-6 py-24">
                <SectionHeader
                    title="21 million students. One platform."
                    description="Real students share how they went from scrolling job boards to signing offer letters."
                    align="center"
                />
                <div className="grid md:grid-cols-3 gap-4">
                    {quotes.map((q) => (
                        <figure
                            key={q.a}
                            className="rounded-lg border border-border bg-card p-6"
                        >
                            <blockquote className="text-[15px] leading-relaxed text-foreground">
                                &ldquo;{q.q}&rdquo;
                            </blockquote>
                            <figcaption className="mt-5 flex items-center gap-3">
                                <span
                                    className={cn(
                                        "h-9 w-9 rounded-full bg-linear-to-br",
                                        q.grad,
                                    )}
                                />
                                <div>
                                    <div className="text-[13px] font-medium">
                                        {q.a}
                                    </div>
                                    <div className="text-[12px] text-muted-foreground">
                                        {q.r}
                                    </div>
                                </div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </SectionFrame>
        </section>
    );
}
