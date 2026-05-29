"use client";

import { NavBar } from "@/src/components/navbar/NavBar";
import { Footer } from "@/src/components/base/Footer";
import {
    H3,
    P,
    PolicyLayout,
    UL,
    type PolicySection,
} from "@/src/components/policy/PolicyLayout";

const SECTIONS: PolicySection[] = [
    {
        id: "why-collaborate",
        label: "Why Collaborate with SpiderSkill?",
        body: (
            <>
                <P>By collaborating with SpiderSkill, you can:</P>
                <UL>
                    <li>Reach ambitious students and young professionals</li>
                    <li>
                        Support career development and skill-building
                        initiatives
                    </li>
                    <li>
                        Increase visibility for your organization or community
                    </li>
                    <li>Connect with startups, founders, and employers</li>
                    <li>Contribute to workforce development</li>
                    <li>Create meaningful opportunities for emerging talent</li>
                    <li>Expand your professional network and impact</li>
                </UL>
                <P>
                    Together, we can help bridge the gap between education and
                    industry.
                </P>
            </>
        ),
    },
    {
        id: "who-can-collaborate",
        label: "Who Can Collaborate?",
        body: (
            <>
                <H3>Colleges &amp; Universities</H3>
                <P>
                    Partner with SpiderSkill to provide students with access to
                    internships, career opportunities, industry exposure, and
                    professional development resources. Potential collaboration
                    areas include:
                </P>
                <UL tight>
                    <li>Internship programs</li>
                    <li>Career development initiatives</li>
                    <li>Placement support</li>
                    <li>Student workshops</li>
                    <li>Industry interaction sessions</li>
                    <li>Startup awareness programs</li>
                </UL>
                <H3>Student Communities &amp; Clubs</H3>
                <P>
                    We love working with student-led communities, coding clubs,
                    entrepreneurship cells, technical societies, and
                    professional organizations. Ways to collaborate:
                </P>
                <UL tight>
                    <li>Community partnerships</li>
                    <li>Events and workshops</li>
                    <li>Career awareness campaigns</li>
                    <li>Student engagement initiatives</li>
                    <li>Networking opportunities</li>
                </UL>
                <H3>Startups &amp; Founders</H3>
                <P>
                    Startups play a vital role in creating opportunities for
                    students and fresh graduates. Collaborate with SpiderSkill
                    to:
                </P>
                <UL tight>
                    <li>Discover emerging talent</li>
                    <li>Promote internship opportunities</li>
                    <li>Participate in startup-focused initiatives</li>
                    <li>
                        Support future professionals through real-world projects
                    </li>
                </UL>
                <H3>Employers &amp; Organizations</H3>
                <P>
                    Companies of all sizes can collaborate with SpiderSkill to
                    connect with motivated students and early-career
                    professionals. Opportunities include:
                </P>
                <UL tight>
                    <li>Internship partnerships</li>
                    <li>Hiring initiatives</li>
                    <li>Employer branding activities</li>
                    <li>Career guidance sessions</li>
                    <li>Industry knowledge sharing</li>
                </UL>
                <H3>Mentors &amp; Industry Professionals</H3>
                <P>
                    Experienced professionals can make a lasting impact by
                    sharing knowledge and career insights. Collaboration
                    opportunities include:
                </P>
                <UL tight>
                    <li>Career mentorship</li>
                    <li>Industry talks</li>
                    <li>Student guidance sessions</li>
                    <li>Skill development workshops</li>
                    <li>Professional development programs</li>
                </UL>
                <H3>Content Creators &amp; Career Experts</H3>
                <P>
                    If you create educational, career, startup, productivity, or
                    professional development content, we&apos;d love to explore
                    opportunities together. Possible collaborations:
                </P>
                <UL tight>
                    <li>Educational content</li>
                    <li>Career guidance resources</li>
                    <li>Student-focused initiatives</li>
                    <li>Expert insights and articles</li>
                    <li>Podcasts and interviews</li>
                </UL>
                <H3>Training Institutes &amp; Learning Platforms</H3>
                <P>
                    Organizations focused on learning, skill development,
                    certifications, and professional education can collaborate
                    to help students become career-ready. Potential areas
                    include:
                </P>
                <UL tight>
                    <li>Skill development programs</li>
                    <li>Career readiness initiatives</li>
                    <li>Educational resources</li>
                    <li>Learning opportunities</li>
                    <li>Professional training</li>
                </UL>
            </>
        ),
    },
    {
        id: "opportunities",
        label: "Collaboration Opportunities",
        body: (
            <>
                <H3>Events &amp; Workshops</H3>
                <P>
                    Host educational sessions, webinars, networking events,
                    career talks, and skill-building workshops that benefit
                    students and young professionals.
                </P>
                <H3>Career Development Programs</H3>
                <P>
                    Work together on initiatives that help students prepare for
                    internships, placements, and professional careers.
                </P>
                <H3>Community Growth</H3>
                <P>
                    Partner to build thriving communities that support learning,
                    networking, and professional development.
                </P>
                <H3>Industry Connections</H3>
                <P>
                    Help students gain exposure to real-world work environments,
                    emerging technologies, and career opportunities.
                </P>
                <H3>Knowledge Sharing</H3>
                <P>
                    Contribute insights, resources, experiences, and expertise
                    that can help the next generation of professionals succeed.
                </P>
            </>
        ),
    },
    {
        id: "principles",
        label: "Our Collaboration Principles",
        body: (
            <>
                <H3>Shared Value</H3>
                <P>
                    We seek partnerships that create meaningful benefits for
                    students, employers, communities, and organizations.
                </P>
                <H3>Long-Term Relationships</H3>
                <P>
                    We believe successful collaborations are built on trust,
                    consistency, and mutual growth.
                </P>
                <H3>Positive Impact</H3>
                <P>
                    Every collaboration should contribute to learning, career
                    development, opportunity creation, or professional growth.
                </P>
                <H3>Innovation &amp; Growth</H3>
                <P>
                    We welcome new ideas and creative approaches that help
                    people learn, connect, and succeed.
                </P>
            </>
        ),
    },
    {
        id: "lets-create",
        label: "Let's Create Opportunities Together",
        body: (
            <>
                <P>
                    SpiderSkill is more than a platform — it&apos;s a growing
                    community of learners, builders, founders, professionals,
                    and organizations working toward a common goal: helping
                    people unlock their potential and achieve career success.
                </P>
                <P>
                    If you believe in empowering students, supporting emerging
                    talent, and creating meaningful opportunities, we&apos;d be
                    excited to hear from you. Let&apos;s collaborate and build
                    something impactful together.
                </P>
            </>
        ),
    },
    {
        id: "interested",
        label: "Interested in Collaborating?",
        body: (
            <>
                <P>
                    Whether you represent a college, startup, company, student
                    community, educational organization, or professional
                    network, we welcome conversations about potential
                    partnerships and collaboration opportunities.
                </P>
                <P>
                    Reach out to us at{" "}
                    <a
                        href="mailto:info@spiderskill.com"
                        className="text-orange-700 hover:underline"
                    >
                        info@spiderskill.com
                    </a>{" "}
                    and let&apos;s explore how we can work together to create
                    value for students, employers, and the broader professional
                    ecosystem.
                </P>
            </>
        ),
    },
];

export default function CollaboratePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="Collaborate"
                    title="Let's Build Opportunities Together"
                    intro={
                        <>
                            <P>
                                SpiderSkill is on a mission to connect students,
                                fresh graduates, startups, and employers through
                                meaningful career opportunities. We believe that
                                great things happen when organizations,
                                communities, educators, founders, and
                                professionals work together.
                            </P>
                            <P>
                                If you share our vision of helping people learn,
                                grow, and succeed, we&apos;d love to explore
                                ways to collaborate. Whether you&apos;re a
                                college, startup, student community, content
                                creator, mentor, training organization, or
                                industry professional, SpiderSkill welcomes
                                partnerships that create value for students and
                                employers alike.
                            </P>
                        </>
                    }
                    sections={SECTIONS}
                />
            </main>
            <Footer />
        </div>
    );
}
