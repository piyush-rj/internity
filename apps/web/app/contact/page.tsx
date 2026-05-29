"use client";

import { NavBar } from "@/src/components/navbar/NavBar";
import { Footer } from "@/src/components/base/Footer";
import {
    Em,
    H3,
    P,
    PolicyLayout,
    UL,
    type PolicySection,
} from "@/src/components/policy/PolicyLayout";

const SECTIONS: PolicySection[] = [
    {
        id: "get-in-touch",
        label: "Get in Touch",
        body: (
            <>
                <P>
                    Have a question about SpiderSkill? Need assistance with your
                    account? Interested in collaborating with us? Looking to
                    hire talent or explore opportunities? We&apos;re happy to
                    help.
                </P>
                <H3>Contact Information</H3>
                <UL tight>
                    <li>
                        <Em>Email:</Em>{" "}
                        <a
                            href="mailto:info@spiderskill.com"
                            className="text-orange-700 hover:underline"
                        >
                            info@spiderskill.com
                        </a>
                    </li>
                    <li>
                        <Em>Website:</Em> www.spiderskill.com
                    </li>
                </UL>
            </>
        ),
    },
    {
        id: "report-a-problem",
        label: "Report a Problem",
        body: (
            <>
                <P>
                    Run into a bug, a broken page, or something that
                    doesn&apos;t look right? Tell us what happened and
                    we&apos;ll look into it. Email{" "}
                    <a
                        href="mailto:info@spiderskill.com?subject=Report%20a%20problem"
                        className="text-orange-700 hover:underline"
                    >
                        info@spiderskill.com
                    </a>{" "}
                    with a short description and, if possible, a screenshot and
                    the page you were on. The more detail you share, the faster
                    we can fix it.
                </P>
            </>
        ),
    },
    {
        id: "contact-us-for",
        label: "Contact Us For",
        body: (
            <>
                <H3>Student Support</H3>
                <P>Get help with:</P>
                <UL tight>
                    <li>Account-related questions</li>
                    <li>Internship applications</li>
                    <li>Profile setup and optimization</li>
                    <li>Opportunity discovery</li>
                    <li>Platform guidance</li>
                    <li>General support</li>
                </UL>
                <H3>Employer Support</H3>
                <P>Reach out regarding:</P>
                <UL tight>
                    <li>Posting opportunities</li>
                    <li>Employer accounts</li>
                    <li>Hiring and recruitment</li>
                    <li>Talent discovery</li>
                    <li>Employer branding</li>
                    <li>Organization profiles</li>
                </UL>
                <H3>Partnerships &amp; Collaborations</H3>
                <P>We welcome discussions related to:</P>
                <UL tight>
                    <li>College partnerships</li>
                    <li>Student communities</li>
                    <li>Startup ecosystems</li>
                    <li>Educational organizations</li>
                    <li>Industry collaborations</li>
                    <li>Events and workshops</li>
                </UL>
                <H3>Media &amp; Press</H3>
                <P>
                    For media inquiries, interviews, speaking opportunities, and
                    press-related communications, please contact our team.
                </P>
                <H3>Feedback &amp; Suggestions</H3>
                <P>
                    We&apos;re continuously improving SpiderSkill and appreciate
                    feedback from our users. Share your:
                </P>
                <UL tight>
                    <li>Feature suggestions</li>
                    <li>Platform improvements</li>
                    <li>User experience feedback</li>
                    <li>Success stories</li>
                    <li>General recommendations</li>
                </UL>
                <P>
                    Your input helps us build a better experience for everyone.
                </P>
            </>
        ),
    },
    {
        id: "response-time",
        label: "Response Time",
        body: (
            <>
                <P>
                    We strive to respond to all inquiries as quickly as
                    possible. Typical response times:
                </P>
                <UL tight>
                    <li>General inquiries: Within 1–2 business days</li>
                    <li>Partnership requests: Within 2–5 business days</li>
                    <li>Support requests: Within 1–2 business days</li>
                    <li>Business inquiries: Within 2–5 business days</li>
                </UL>
            </>
        ),
    },
    {
        id: "lets-connect",
        label: "Let's Connect",
        body: (
            <>
                <P>
                    SpiderSkill is building a community where talent meets
                    opportunity. Whether you&apos;re seeking career growth,
                    hiring exceptional talent, exploring partnerships, or
                    sharing ideas, we&apos;d love to connect.
                </P>
                <P>
                    Thank you for being part of the SpiderSkill journey. We look
                    forward to hearing from you.
                </P>
            </>
        ),
    },
];

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="Contact"
                    title="We'd Love to Hear From You"
                    intro={
                        <P>
                            Whether you&apos;re a student, employer, startup
                            founder, recruiter, college representative,
                            community leader, or potential partner, we&apos;re
                            here to help. At SpiderSkill, we value every
                            conversation and welcome questions, feedback,
                            suggestions, partnership inquiries, and support
                            requests.
                        </P>
                    }
                    sections={SECTIONS}
                />
            </main>
            <Footer />
        </div>
    );
}
