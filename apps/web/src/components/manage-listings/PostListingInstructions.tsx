"use client";

import {
    AlertTriangle,
    BadgeCheck,
    Lightbulb,
    Ban,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

// Right-rail instructions panel for the post-listing form. Two grouped
// blocks (best-practice tips, then dos / don'ts) so the founder knows what
// the platform expects before they hit Post. Pure presentation — the form
// itself does the validation; this is a discoverability nudge.

const TIPS = [
    "Pick a job title from the list so applicants find your role under the right filter.",
    "Use the Autofill button next to the job title to pre-fill description, perks, and skills — then tweak.",
    "Add 3–5 must-have skills (no jargon). They drive the match score on each applicant card.",
    "Be honest about stipend. Listings with a stipend get ~3× more qualified applications than blank ones.",
    "Screening questions are optional but powerful — 1–3 short questions filter noise without scaring applicants away.",
];

const POLICY: { tone: "ok" | "no"; text: string }[] = [
    {
        tone: "ok",
        text: "Internships, freelance gigs, full-time entry-level roles, and contract work are welcome.",
    },
    {
        tone: "ok",
        text: "Specify what the intern will actually build — vague descriptions get hidden from search.",
    },
    {
        tone: "no",
        text: "No MLM, pyramid schemes, or commission-only roles disguised as internships.",
    },
    {
        tone: "no",
        text: "Never ask applicants to pay any fee — registration, training, certification, anything.",
    },
    {
        tone: "no",
        text: "Don't reuse one listing across multiple roles — each role gets its own post.",
    },
];

export function PostListingInstructions() {
    return (
        <aside className="space-y-4">
            <Card
                icon={Lightbulb}
                tone="amber"
                title="Tips for a great listing"
                items={TIPS}
            />
            <Card icon={BadgeCheck} tone="emerald" title="Platform rules">
                <ul className="space-y-2.5">
                    {POLICY.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                            {p.tone === "ok" ? (
                                <BadgeCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                            ) : (
                                <Ban className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-600" />
                            )}
                            <span className="text-[12.5px] leading-relaxed text-foreground/85">
                                {p.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[12px] text-amber-900 leading-relaxed">
                    Listings that break the rules get taken down by an admin
                    with a note explaining why. You can edit and resubmit.
                </p>
            </div>
        </aside>
    );
}

function Card({
    icon: Icon,
    tone,
    title,
    items,
    children,
}: {
    icon: LucideIcon;
    tone: "amber" | "emerald";
    title: string;
    items?: string[];
    children?: React.ReactNode;
}) {
    const toneStyle =
        tone === "amber"
            ? "bg-neutral-300"
            : "bg-brand";
    const iconStyle = tone === "amber" ? "text-neutral-800" : "text-neutral-800";
    return (
        <section
            className={cn(
                "rounded-lg border bg-card overflow-hidden",
                toneStyle,
            )}
        >
            <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/60">
                <Icon className={cn("h-3.5 w-3.5", iconStyle)} />
                <h3 className="text-[13px] font-semibold">{title}</h3>
            </header>
            <div className="px-4 py-3 bg-white">
                {items ? (
                    <ul className="space-y-2">
                        {items.map((t, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-[12.5px] text-foreground/85 leading-relaxed"
                            >
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground/40 shrink-0" />
                                <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}
