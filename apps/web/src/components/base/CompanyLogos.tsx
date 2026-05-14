import { SectionFrame } from "@/src/components/base/SectionFrame";
import { cn } from "@/src/lib/utils";

export function CompanyLogos() {
    const logos = [
        "Amazon",
        "Microsoft",
        "Flipkart",
        "Swiggy",
        "Zomato",
        "Tata",
        "Infosys",
        "Razorpay",
        "Paytm",
        "Ola",
        "Meesho",
        "CRED",
        "PhonePe",
        "Byju's",
    ];
    return (
        <section className="">
            <SectionFrame className="px-6 py-20 sm:py-24">
                <div
                    className={cn(
                        "relative overflow-hidden",
                        "mask-[linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]",
                    )}
                >
                    <div className="flex w-max scroll-marquee gap-14 items-center">
                        {[...logos, ...logos].map((logo, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "whitespace-nowrap",
                                    "text-[22px] font-semibold tracking-tight",
                                    "text-muted-foreground/80 hover:text-foreground",
                                    "transition-colors",
                                )}
                            >
                                {logo}
                            </span>
                        ))}
                    </div>
                </div>
            </SectionFrame>
        </section>
    );
}
