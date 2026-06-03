import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { Button, buttonVariants } from "../ui/button";

type CTA = {
    label: string;
    href?: string;
};

export type SectionAccent = { src: string; alt: string };

type SectionHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    cta?: CTA;
    align?: "left" | "center";
    className?: string;
    // Small decorative photo rendered beside the header on lg+. Hidden on
    // smaller screens so the layout stays clean.
    accent?: SectionAccent;
};

export function SectionHeader({
    title,
    description,
    cta,
    align = "left",
    className,
    accent,
}: SectionHeaderProps) {
    const isCenter = align === "center";
    const textColumn = (
        <div className={cn("max-w-2xl", isCenter && "mx-auto text-center")}>
            <h2
                className={cn(
                    "text-[26px] sm:text-[34px] lg:text-[44px] font-semibold",
                    "leading-[1.05] tracking-[-0.02em]",
                    "text-foreground",
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        "mt-3 sm:mt-4 text-[14.5px] sm:text-[16px] lg:text-[17px] text-muted-foreground leading-relaxed max-w-xl",
                        isCenter && "mx-auto",
                    )}
                >
                    {description}
                </p>
            )}

            {cta && (
                <div
                    className={cn(
                        "mt-6 sm:mt-8",
                        isCenter && "flex justify-center",
                    )}
                >
                    {cta.href ? (
                        <Link
                            href={cta.href}
                            className={cn(
                                buttonVariants({ variant: "exec-dark" }),
                                "inline-flex items-center gap-2 h-10 px-5",
                            )}
                        >
                            {cta.label}
                        </Link>
                    ) : (
                        <Button
                            variant="exec-dark"
                            className="inline-flex items-center gap-2 h-10 px-5"
                        >
                            {cta.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );

    // No accent or center-aligned headers fall back to the original layout.
    if (!accent || isCenter) {
        return (
            <div className={cn("mb-8 sm:mb-12", className)}>{textColumn}</div>
        );
    }

    return (
        <div
            className={cn(
                "mb-8 sm:mb-12 flex items-start gap-8",
                "lg:items-center",
                className,
            )}
        >
            <div className="flex-1 min-w-0">{textColumn}</div>
            <div
                aria-hidden
                className={cn(
                    "hidden lg:block shrink-0",
                    "relative w-50 h-60 rounded-2xl overflow-hidden",
                    "ring-1 ring-black/5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)]",
                )}
            >
                <Image
                    src={accent.src}
                    alt={accent.alt}
                    fill
                    sizes="200px"
                    className="object-cover"
                />
            </div>
        </div>
    );
}
