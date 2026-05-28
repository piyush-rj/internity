"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

export type PolicySection = {
    id: string;
    label: string;
    body: React.ReactNode;
};

export type PolicyLayoutProps = {
    eyebrow?: string;
    title: string;
    updated?: string;
    intro?: React.ReactNode;
    sections: PolicySection[];
    sidebarHeader?: React.ReactNode;
};

export function PolicyLayout({
    eyebrow,
    title,
    updated,
    intro,
    sections,
    sidebarHeader,
}: PolicyLayoutProps) {
    const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
    const clickLockRef = useRef<string | null>(null);
    const clickLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveId(sections[0]?.id ?? "");
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (clickLockRef.current) return;
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );
                if (visible.length > 0) {
                    setActiveId(visible[0]!.target.id);
                }
            },
            {
                rootMargin: "-96px 0px -65% 0px",
                threshold: 0,
            },
        );
        for (const s of sections) {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [sections]);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        clickLockRef.current = id;
        setActiveId(id);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current);
        clickLockTimerRef.current = setTimeout(() => {
            clickLockRef.current = null;
        }, 700);
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            <header className="mb-10 border-b border-black/20 pb-10">
                {eyebrow && (
                    <span className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-[11.5px] font-medium">
                        {eyebrow}
                    </span>
                )}
                <h1 className="mt-3 text-[32px] sm:text-[36px] font-semibold tracking-tight leading-tight">
                    {title}
                </h1>
                {updated && (
                    <p className="mt-2 text-[12.5px] text-muted-foreground">
                        Last updated: {updated}
                    </p>
                )}
                {intro && (
                    <div className="mt-5 max-w-3xl text-[14px] leading-relaxed text-foreground/90 space-y-3">
                        {intro}
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-12">
                <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                    {sidebarHeader && (
                        <div className="mb-4">{sidebarHeader}</div>
                    )}
                    <nav aria-label="On this page">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                            On this page
                        </p>
                        <ul className="space-y-0.5 border-l border-border">
                            {sections.map((s) => {
                                const active = s.id === activeId;
                                return (
                                    <li key={s.id} className="-ml-px">
                                        <button
                                            type="button"
                                            onClick={() => scrollTo(s.id)}
                                            className={cn(
                                                "w-full text-left pl-3 pr-2 py-1.5 text-[12.5px] cursor-pointer",
                                                "border-l-2 transition-colors",
                                                active
                                                    ? "border-orange-500 text-orange-700 font-medium"
                                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/20",
                                            )}
                                            aria-current={
                                                active ? "true" : undefined
                                            }
                                        >
                                            {s.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>

                <article className="min-w-0 space-y-10">
                    {sections.map((s) => (
                        <section
                            key={s.id}
                            id={s.id}
                            className="scroll-mt-24"
                            aria-labelledby={`${s.id}-heading`}
                        >
                            <h2
                                id={`${s.id}-heading`}
                                className="text-[20px] font-semibold tracking-tight mb-3"
                            >
                                {s.label}
                            </h2>
                            <div className="text-[14px] leading-relaxed text-foreground/90 space-y-3">
                                {s.body}
                            </div>
                        </section>
                    ))}
                </article>
            </div>
        </div>
    );
}

// Convenience prose helpers for legal pages.
export function P({ children }: { children: React.ReactNode }) {
    return <p>{children}</p>;
}

export function UL({
    children,
    tight,
}: {
    children: React.ReactNode;
    tight?: boolean;
}) {
    return (
        <ul
            className={cn(
                "list-disc pl-5 marker:text-muted-foreground",
                tight ? "space-y-1" : "space-y-1.5",
            )}
        >
            {children}
        </ul>
    );
}

export function H3({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[15px] font-semibold mt-5 mb-1.5">{children}</h3>
    );
}

export function Em({ children }: { children: React.ReactNode }) {
    return <span className="font-medium text-foreground">{children}</span>;
}
