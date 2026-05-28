import type { ReactNode } from "react";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import {
    SectionHeader,
    type SectionAccent,
} from "@/src/components/base/SectionHeader";

export function SectionShell({
    title,
    subtitle,
    cta,
    accent,
    children,
}: {
    title: string;
    subtitle: string;
    cta?: { label: string; href?: string };
    accent?: SectionAccent;
    children: ReactNode;
}) {
    return (
        <section>
            <SectionFrame className="px-10 py-24">
                <SectionHeader
                    title={title}
                    description={subtitle}
                    cta={cta}
                    accent={accent}
                />
                {children}
            </SectionFrame>
        </section>
    );
}
