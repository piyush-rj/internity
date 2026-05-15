import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";

export type IconTone =
    | "violet"
    | "orange"
    | "emerald"
    | "blue"
    | "pink"
    | "amber"
    | "rose"
    | "sky"
    | "zinc";

type Eyebrow = {
    icon: ReactNode;
    label: string;
    tone?: IconTone;
};

type CTA = {
    label: string;
    href?: string;
};

type SectionHeaderProps = {
    eyebrow?: Eyebrow;
    title: ReactNode;
    description?: ReactNode;
    cta?: CTA;
    align?: "left" | "center";
    className?: string;
};

const tones: Record<IconTone, string> = {
    violet: "bg-violet-500/15 text-violet-600",
    orange: "bg-orange-500/15 text-orange-600",
    emerald: "bg-emerald-500/15 text-emerald-700",
    blue: "bg-blue-500/15 text-blue-600",
    pink: "bg-pink-500/15 text-pink-600",
    amber: "bg-amber-500/15 text-amber-700",
    rose: "bg-rose-500/15 text-rose-600",
    sky: "bg-sky-500/15 text-sky-600",
    zinc: "bg-zinc-900/[0.06] text-zinc-700",
};

export function SectionHeader({
    eyebrow,
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
            {eyebrow && (
                <div
                    className={cn(
                        "flex items-center gap-2 mb-6",
                        isCenter && "justify-center",
                    )}
                >
                    <span
                        className={cn(
                            "h-6 w-6 inline-flex items-center justify-center rounded-[5px]",
                            tones[eyebrow.tone ?? "violet"],
                        )}
                    >
                        {eyebrow.icon}
                    </span>
                    <span className="text-[13px] font-medium text-foreground">
                        {eyebrow.label}
                    </span>
                </div>
            )}

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
                        // href={cta.href ?? "#"}
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
