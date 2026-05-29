"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import type { InstructionSection } from "@/src/lib/catalog/instructions";
import { cn } from "@/src/lib/utils";

const SUPPORT_EMAIL = "info@spiderskill.com";

// Long-form instruction page layout with a sticky mini-TOC on the right
// that scrolls to a section when clicked and highlights the section
// currently in view. Used by /home/instructions for both audiences.
export function InstructionsLayout({
    heading,
    intro,
    sections,
}: {
    heading: string;
    intro: string;
    sections: ReadonlyArray<InstructionSection>;
}) {
    const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

    // Highlight the section closest to the top of the viewport. Trigger
    // line sits a bit below the sticky topbar so the first section lights
    // up as soon as you start reading it.
    useEffect(() => {
        if (sections.length === 0) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
        );
        for (const s of sections) {
            const el = document.getElementById(s.id);
            if (el) obs.observe(el);
        }
        return () => obs.disconnect();
    }, [sections]);

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
            <header className="mb-8">
                <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">
                    {heading}
                </h1>
                <p className="mt-2 text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
                    {intro}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
                <article className="space-y-10 min-w-0">
                    {sections.map((s) => (
                        <section key={s.id} id={s.id} className="scroll-mt-20">
                            <h2 className="text-[17px] font-semibold tracking-tight">
                                {s.title}
                            </h2>
                            <div className="mt-3 space-y-2.5">
                                {s.body.map((p, i) => (
                                    <p
                                        key={i}
                                        className="text-[14px] text-foreground/85 leading-relaxed"
                                    >
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </article>

                <aside className="hidden lg:block">
                    <div className="sticky top-20 space-y-5">
                        <nav
                            aria-label="On this page"
                            className="border-l border-border pl-4"
                        >
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                On this page
                            </p>
                            <ul className="space-y-1.5">
                                {sections.map((s) => {
                                    const active = s.id === activeId;
                                    return (
                                        <li key={s.id}>
                                            <a
                                                href={`#${s.id}`}
                                                className={cn(
                                                    "block text-[12.5px] leading-snug transition-colors",
                                                    "py-1 -ml-px border-l-2 pl-3",
                                                    active
                                                        ? "border-brand text-foreground font-medium"
                                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                {s.title}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <NeedHelp />
                    </div>
                </aside>

                <div className="lg:hidden">
                    <NeedHelp />
                </div>
            </div>
        </div>
    );
}

function NeedHelp() {
    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3.5">
            <p className="text-[12.5px] font-semibold tracking-tight">
                Need help?
            </p>
            <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "mt-1.5 inline-flex items-center gap-1.5",
                    "text-[12px] text-foreground/80 hover:text-brand",
                    "transition-colors",
                )}
            >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {SUPPORT_EMAIL}
            </a>
        </div>
    );
}
