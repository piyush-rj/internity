"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { NavBar } from "@/src/components/navbar/NavBar";
import { Footer } from "@/src/components/base/Footer";
import {
    Em,
    P,
    PolicyLayout,
    UL,
    type PolicySection,
} from "@/src/components/policy/PolicyLayout";
import { cn } from "@/src/lib/utils";

type Audience = "students" | "founders";

type FaqItem = { q: string; a: React.ReactNode };
type FaqGroup = { id: string; label: string; items: FaqItem[] };

// Inline arrow separator used in step-by-step FAQ answers.
function Step() {
    return (
        <ArrowRight
            aria-hidden
            className="inline-block h-3 w-3 mx-1 align-middle text-muted-foreground"
        />
    );
}

const STUDENT_GROUPS: FaqGroup[] = [
    {
        id: "getting-started",
        label: "Getting Started",
        items: [
            {
                q: "What is SpiderSkill?",
                a: (
                    <P>
                        A platform that connects students with verified startups
                        for real internship opportunities.
                    </P>
                ),
            },
            {
                q: "Is SpiderSkill free for students?",
                a: (
                    <P>
                        Yes, 100% free. Signing up, building your profile, and
                        applying to internships costs nothing.
                    </P>
                ),
            },
            {
                q: "How do I sign up?",
                a: (
                    <P>
                        Click &ldquo;Sign Up&rdquo; <Step /> select
                        &ldquo;I&apos;m a Student&rdquo; <Step /> fill in your
                        details <Step /> complete your profile. Done.
                    </P>
                ),
            },
        ],
    },
    {
        id: "profile-applications",
        label: "Profile & Applications",
        items: [
            {
                q: "What should my profile include?",
                a: (
                    <P>
                        Name, college, branch, year, CGPA, skills, resume (PDF),
                        LinkedIn URL, and a portfolio link if you have one. A
                        complete profile gets more responses.
                    </P>
                ),
            },
            {
                q: "How does 1-click apply work?",
                a: (
                    <P>
                        Your profile is automatically sent to the founder when
                        you apply. You can optionally add a short cover note
                        (max 250 characters). No forms to fill.
                    </P>
                ),
            },
            {
                q: "Can I apply to multiple internships at once?",
                a: (
                    <P>
                        Yes. Select multiple listings and apply to all in one
                        go. Only apply to roles that match your skills —
                        irrelevant applications may get your account penalised.
                    </P>
                ),
            },
            {
                q: "Can I edit my application after submitting?",
                a: (
                    <P>
                        No. Applications cannot be edited once submitted. Keep
                        your profile updated before applying.
                    </P>
                ),
            },
            {
                q: "Is the cover note mandatory?",
                a: (
                    <P>
                        No, it&apos;s optional. But a clear, specific note (150
                        characters max) can help you stand out.
                    </P>
                ),
            },
        ],
    },
    {
        id: "tracking",
        label: "Tracking & Notifications",
        items: [
            {
                q: "How do I track my applications?",
                a: (
                    <P>
                        Check the Application Tracker in your dashboard.
                        You&apos;ll also get email notifications on every status
                        update.
                    </P>
                ),
            },
            {
                q: "What do the application statuses mean?",
                a: (
                    <UL tight>
                        <li>
                            <Em>Applied</Em> — Submitted, waiting for founder to
                            review
                        </li>
                        <li>
                            <Em>Seen</Em> — Founder has viewed your application
                        </li>
                        <li>
                            <Em>Shortlisted</Em> — Founder is interested, may
                            reach out soon
                        </li>
                        <li>
                            <Em>Rejected</Em> — Not moving forward this time
                        </li>
                    </UL>
                ),
            },
        ],
    },
    {
        id: "safety",
        label: "Communication & Safety",
        items: [
            {
                q: "How do founders contact me?",
                a: (
                    <P>
                        Through the SpiderSkill inbox. Respond promptly —
                        ignoring messages can hurt your profile standing.
                    </P>
                ),
            },
            {
                q: "A founder is asking me to pay a fee. What do I do?",
                a: (
                    <P>
                        Don&apos;t pay. SpiderSkill never allows founders to
                        charge students anything. Report it immediately at
                        info@spiderskill.in.
                    </P>
                ),
            },
            {
                q: "What if a listing looks suspicious?",
                a: (
                    <P>
                        Don&apos;t proceed. Report it via the
                        &ldquo;Report&rdquo; option on the listing or write to
                        info@spiderskill.in.
                    </P>
                ),
            },
            {
                q: "Can I save internships for later?",
                a: (
                    <P>
                        Yes. Use the Bookmark feature. Bookmarking does not
                        count as applying.
                    </P>
                ),
            },
            {
                q: "Does SpiderSkill guarantee I'll get an internship?",
                a: (
                    <P>
                        No. We bring you the best opportunities, but selection
                        depends on the founder&apos;s requirements and your
                        profile.
                    </P>
                ),
            },
        ],
    },
];

const FOUNDER_GROUPS: FaqGroup[] = [
    {
        id: "getting-started",
        label: "Getting Started",
        items: [
            {
                q: "What is SpiderSkill?",
                a: (
                    <P>
                        A hiring platform built for startups to find and hire
                        interns directly — no noise, no middlemen, just
                        motivated students ready to work.
                    </P>
                ),
            },
            {
                q: "How do I sign up as a founder?",
                a: (
                    <P>
                        Click &ldquo;Sign Up&rdquo; <Step /> select
                        &ldquo;I&apos;m a Founder/Employer&rdquo; <Step /> fill
                        in your company details <Step /> submit for
                        verification. You&apos;ll be approved within a few
                        hours.
                    </P>
                ),
            },
            {
                q: "Why is verification required?",
                a: (
                    <P>
                        It&apos;s a one-time check to confirm you&apos;re a
                        legitimate organization. This keeps the platform safe
                        for students. Supporting documents may be requested in
                        some cases.
                    </P>
                ),
            },
            {
                q: "How long does verification take?",
                a: (
                    <P>
                        A few hours. You&apos;ll get confirmation once approved.
                    </P>
                ),
            },
        ],
    },
    {
        id: "posting",
        label: "Posting Internships",
        items: [
            {
                q: "How do I post an internship?",
                a: (
                    <P>
                        Go to your dashboard <Step /> click &ldquo;Post
                        Internship&rdquo; <Step /> fill in the role, skills,
                        stipend, duration, work type, openings, and deadline.
                        First-time posters can use our templates or auto-fill.
                    </P>
                ),
            },
            {
                q: "What is the minimum stipend?",
                a: (
                    <>
                        <P>
                            We encourage employers to offer fair and competitive
                            stipends. Generally:
                        </P>
                        <UL tight>
                            <li>
                                In-office internships should offer at least
                                ₹2,000/month
                            </li>
                            <li>
                                Work from home internships should offer at least
                                ₹1,000/month
                            </li>
                        </UL>
                        <P>
                            Higher stipends usually attract more applicants and
                            better engagement. Unpaid internships are generally
                            discouraged, except for certain NGOs/NPOs,
                            government organizations, or special cases approved
                            by SpiderSkill.
                        </P>
                    </>
                ),
            },
            {
                q: "How long does a listing stay active?",
                a: (
                    <P>
                        30 days. You&apos;ll get an email reminder before it
                        expires and can renew from your dashboard.
                    </P>
                ),
            },
            {
                q: "Can I pause a listing without deleting it?",
                a: (
                    <P>
                        Yes. Use &ldquo;Pause Hiring&rdquo; to stop new
                        applications temporarily. Reactivate anytime.
                    </P>
                ),
            },
            {
                q: "Can I add team members to my account?",
                a: (
                    <P>
                        Yes. Send email invites from your dashboard. Team
                        members can manage listings and review applicants on
                        your behalf.
                    </P>
                ),
            },
        ],
    },
    {
        id: "applicants",
        label: "Managing Applicants",
        items: [
            {
                q: "How do I view applicants?",
                a: (
                    <P>
                        Open any listing from your dashboard to see all
                        applicants with their name, college, skills, resume, and
                        LinkedIn. Sort by relevance, name, or college.
                    </P>
                ),
            },
            {
                q: "How do I update an applicant's status?",
                a: (
                    <P>
                        Open the applicant&apos;s profile and change their
                        status — Reviewing, Shortlisted, Selected, Rejected,
                        Seen, or Not Seen. The student is auto-notified on every
                        update.
                    </P>
                ),
            },
            {
                q: "How do I communicate with applicants?",
                a: (
                    <P>
                        Use SpiderSkill Chat to message shortlisted students —
                        for interview links, scheduling, or next steps. Keep all
                        communication professional.
                    </P>
                ),
            },
            {
                q: "What kind of assignments can I give applicants?",
                a: (
                    <P>
                        Assignments must be relevant and fair in scope. You
                        cannot use assessments to extract free work, or generate
                        social media engagement. Violations will lead to account
                        action.
                    </P>
                ),
            },
        ],
    },
    {
        id: "pricing",
        label: "Pricing & Payments",
        items: [
            {
                q: "How much does it cost?",
                a: (
                    <UL tight>
                        <li>Per Post: ₹999</li>
                        <li>Monthly Plan: ₹2,499/month</li>
                        <li>Yearly Plan: ₹9,999/year</li>
                    </UL>
                ),
            },
        ],
    },
];

const TABS: { id: Audience; label: string; description: string }[] = [
    {
        id: "students",
        label: "For Students",
        description:
            "How to apply, what to expect, and how to stay safe on SpiderSkill.",
    },
    {
        id: "founders",
        label: "For Founders / Employers",
        description:
            "Posting listings, managing applicants, pricing, and account setup.",
    },
];

function groupsToSections(groups: FaqGroup[]): PolicySection[] {
    return groups.map((g) => ({
        id: g.id,
        label: g.label,
        body: (
            <div className="space-y-6">
                {g.items.map((item, idx) => (
                    <div key={idx}>
                        <p className="text-[14px] font-semibold mb-1.5">
                            <span className="text-muted-foreground mr-2 font-medium">
                                Q.
                            </span>
                            {item.q}
                        </p>
                        <div className="pl-6 text-[13.5px] leading-relaxed text-foreground/90 space-y-2">
                            {item.a}
                        </div>
                    </div>
                ))}
            </div>
        ),
    }));
}

export default function FaqPage() {
    const [tab, setTab] = useState<Audience>("students");

    const sections = useMemo(() => {
        const groups = tab === "students" ? STUDENT_GROUPS : FOUNDER_GROUPS;
        return groupsToSections(groups);
    }, [tab]);

    const activeTab = TABS.find((t) => t.id === tab)!;

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="Help Center"
                    title="Frequently asked questions"
                    intro={
                        <p className="text-muted-foreground">
                            {activeTab.description} Switch audience using the
                            toggle in the sidebar. Still stuck? Write to{" "}
                            <a
                                href="mailto:info@spiderskill.in"
                                className="text-orange-700 hover:underline"
                            >
                                info@spiderskill.in
                            </a>
                            .
                        </p>
                    }
                    sidebarHeader={
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
                                Audience
                            </p>
                            <div
                                role="tablist"
                                aria-label="FAQ audience"
                                className="rounded-md border border-border bg-card p-1 flex flex-col gap-0.5"
                            >
                                {TABS.map((t) => {
                                    const active = t.id === tab;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setTab(t.id)}
                                            className={cn(
                                                "text-left px-2.5 py-1.5 rounded text-[12.5px] cursor-pointer transition-colors",
                                                active
                                                    ? "bg-brand text-white font-medium"
                                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    }
                    sections={sections}
                />
            </main>
            <Footer />
        </div>
    );
}
