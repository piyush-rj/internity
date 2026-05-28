"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Lightbulb, ShieldAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Right-rail nudges on the post-listing form. Each row is a 1-2 line
// summary linking to the matching section on /home/instructions. The
// hover state surfaces an ArrowUpRight to signal "this opens a longer
// read elsewhere" so founders aren't surprised by the navigation.

type Tip = {
    text: string;
    sectionId: string;
};

const TIPS: ReadonlyArray<Tip> = [
    {
        text: "Pick a job title from the list so applicants find your role under the right filter.",
        sectionId: "clear-listings",
    },
    {
        text: "Use Autofill to seed the description, perks, and skills, then tweak.",
        sectionId: "clear-listings",
    },
    {
        text: "Add 3 to 5 must-have skills (no jargon). They drive the match score.",
        sectionId: "clear-listings",
    },
    {
        text: "Be honest about stipend. Listings with one get roughly 3x more qualified applications.",
        sectionId: "competitive-stipends",
    },
    {
        text: "Screening questions are optional but powerful. Keep them to 1 to 3 short questions.",
        sectionId: "clear-listings",
    },
];

const RULES: ReadonlyArray<Tip> = [
    {
        text: "Internships, freelance gigs, entry-level full-time, and contract work are welcome.",
        sectionId: "clear-listings",
    },
    {
        text: "Spell out what the intern will actually build. Vague listings get hidden from search.",
        sectionId: "clear-listings",
    },
    {
        text: "No MLM, pyramid schemes, or commission-only roles disguised as internships.",
        sectionId: "transparent-hiring",
    },
    {
        text: "Never ask applicants for a fee. Not for registration, training, or certification.",
        sectionId: "transparent-hiring",
    },
    {
        text: "One listing per role. Don't reuse a single post across multiple positions.",
        sectionId: "keep-listings-updated",
    },
];

export function PostListingInstructions() {
    return (
        <aside className="space-y-4">
            <Card icon={Lightbulb} title="Tips for a great listing" tips={TIPS} />
            <Card icon={BadgeCheck} title="Platform rules" tips={RULES} />
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 flex items-start gap-2">
                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[12px] text-amber-900 leading-relaxed">
                    Listings that break the rules get taken down by an admin
                    with a note explaining why. You can edit and resubmit.
                </p>
            </div>
            <Link
                href="/home/instructions"
                className={cn(
                    "block rounded-lg border border-border bg-card px-3 py-2.5",
                    "text-[12.5px] font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/60",
                    "transition-colors",
                )}
            >
                <span className="inline-flex items-center gap-1.5">
                    Read the full founder instructions
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
            </Link>
        </aside>
    );
}

function Card({
    icon: Icon,
    title,
    tips,
}: {
    icon: typeof Lightbulb;
    title: string;
    tips: ReadonlyArray<Tip>;
}) {
    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Icon className="h-3.5 w-3.5 text-foreground/70" />
                <h3 className="text-[13px] font-semibold">{title}</h3>
            </header>
            <ul className="p-1.5">
                {tips.map((t, i) => (
                    <li key={i}>
                        <Link
                            href={`/home/instructions#${t.sectionId}`}
                            className={cn(
                                "group flex items-start gap-2.5 rounded-md px-2.5 py-2",
                                "text-[12.5px] leading-relaxed text-foreground/85",
                                "transition-colors hover:bg-secondary/70 hover:text-foreground",
                            )}
                        >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40 group-hover:bg-brand" />
                            <span className="min-w-0 flex-1">{t.text}</span>
                            <ArrowUpRight
                                className={cn(
                                    "h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground",
                                    "opacity-0 -translate-x-0.5 translate-y-0.5",
                                    "transition-all duration-150",
                                    "group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0",
                                )}
                                aria-hidden
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
