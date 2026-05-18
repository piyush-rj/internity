import type { ReactNode } from "react";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import { SectionHeader } from "@/src/components/base/SectionHeader";

export function SectionShell({
    title,
    subtitle,
    cta,
    children,
}: {
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
                    title={title}
                    description={subtitle}
                    cta={cta}
                />
                {children}
            </SectionFrame>
        </section>
    );
}
