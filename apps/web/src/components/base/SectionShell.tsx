import type { ReactNode } from "react";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import {
    SectionHeader,
    type IconTone,
} from "@/src/components/base/SectionHeader";

export function SectionShell({
    eyebrow,
    eyebrowIcon,
    eyebrowTone,
    title,
    subtitle,
    cta,
    children,
}: {
    /** Short label rendered next to the colored icon tile. */
    eyebrow: string;
    /** Glyph (typically a small SVG) shown inside the icon tile. */
    eyebrowIcon?: ReactNode;
    /** Tailwind tone for the icon tile background + text. */
    eyebrowTone?: IconTone;
    title: string;
    subtitle: string;
    /** Optional secondary CTA rendered below the description. */
    cta?: { label: string; href?: string };
    children: ReactNode;
}) {
    return (
        <section>
            <SectionFrame className="px-10 py-24">
                <SectionHeader
                    eyebrow={
                        eyebrowIcon
                            ? {
                                  icon: eyebrowIcon,
                                  label: eyebrow,
                                  tone: eyebrowTone,
                              }
                            : undefined
                    }
                    title={title}
                    description={subtitle}
                    cta={cta}
                />
                {children}
            </SectionFrame>
        </section>
    );
}
