import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";

type CTA = {
    label: string;
    href?: string;
};

type SectionHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    cta?: CTA;
    align?: "left" | "center";
    className?: string;
};

export function SectionHeader({
    title,
    description,
    cta,
    align = "left",
    className,
}: SectionHeaderProps) {
    const isCenter = align === "center";
    return (
        <div
            className={cn(
                "max-w-2xl mb-12",
                isCenter && "mx-auto text-center",
                className,
            )}
        >
            <h2
                className={cn(
                    "text-[32px] sm:text-[44px] font-semibold",
                    "leading-[1.05] tracking-[-0.02em]",
                    "text-foreground",
                )}
            >
                {title}
            </h2>

            {description && (
                <p
                    className={cn(
                        "mt-4 text-[16px] sm:text-[17px] text-muted-foreground leading-relaxed max-w-xl",
                        isCenter && "mx-auto",
                    )}
                >
                    {description}
                </p>
            )}

            {cta && (
                <div className={cn("mt-8", isCenter && "flex justify-center")}>
                    <Button
                        variant={"exec-dark"}
                        className={cn(
                            "inline-flex items-center gap-2 h-10 px-5",
                        )}
                    >
                        {cta.label}
                    </Button>
                </div>
            )}
        </div>
    );
}
