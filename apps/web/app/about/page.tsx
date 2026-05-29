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
        id: "vision",
        label: "Our Vision",
        body: (
            <>
                <P>
                    We envision a future where every student can discover
                    opportunities based on their skills and potential,
                    regardless of their background, network, or prior
                    experience.
                </P>
                <P>
                    SpiderSkill aims to become a trusted ecosystem where
                    students launch their careers, employers discover emerging
                    talent, and startups build exceptional teams.
                </P>
            </>
        ),
    },
    {
        id: "why-we-built",
        label: "Why We Built SpiderSkill",
        body: (
            <>
                <P>
                    Many students struggle to gain practical experience before
                    graduation. At the same time, startups and growing
                    businesses often find it difficult to discover motivated
                    talent for internships, projects, and entry-level roles.
                    SpiderSkill was created to solve this challenge.
                </P>
                <P>We wanted to build a platform where:</P>
                <UL>
                    <li>
                        Students can discover real opportunities to learn and
                        grow.
                    </li>
                    <li>
                        Fresh graduates can take the first step in their
                        professional journey.
                    </li>
                    <li>Startups can access ambitious talent.</li>
                    <li>Employers can build strong talent pipelines.</li>
                    <li>Skills and potential matter as much as experience.</li>
                </UL>
            </>
        ),
    },
    {
        id: "what-we-do",
        label: "What We Do",
        body: (
            <>
                <P>
                    SpiderSkill helps connect individuals and organizations
                    through opportunities designed for growth and professional
                    development. Our platform supports:
                </P>
                <H3>Internship Opportunities</H3>
                <P>
                    Helping students gain practical experience and industry
                    exposure.
                </P>
                <H3>Entry-Level Careers</H3>
                <P>
                    Connecting fresh graduates with organizations seeking
                    emerging talent.
                </P>
                <H3>Startup Hiring</H3>
                <P>
                    Enabling startups and founders to find motivated team
                    members.
                </P>
                <H3>Freelance &amp; Project Opportunities</H3>
                <P>
                    Providing hands-on experience through real-world projects.
                </P>
                <H3>Career Development Resources</H3>
                <P>
                    Offering guidance, learning resources, and career-focused
                    content.
                </P>
                <H3>Talent Discovery</H3>
                <P>
                    Helping employers identify skilled and promising candidates.
                </P>
            </>
        ),
    },
    {
        id: "who-we-serve",
        label: "Who We Serve",
        body: (
            <>
                <H3>Students</H3>
                <P>
                    Students looking to gain experience, develop skills, build
                    portfolios, and prepare for successful careers.
                </P>
                <H3>Fresh Graduates</H3>
                <P>
                    Individuals seeking internships, entry-level positions, and
                    professional growth opportunities.
                </P>
                <H3>Startups</H3>
                <P>
                    Founders and startup teams looking to build strong, agile
                    teams with ambitious talent.
                </P>
                <H3>Employers</H3>
                <P>
                    Organizations seeking interns, graduates, and early-career
                    professionals.
                </P>
                <H3>Recruiters</H3>
                <P>
                    Professionals searching for motivated candidates and future
                    talent.
                </P>
            </>
        ),
    },
    {
        id: "values",
        label: "Our Values",
        body: (
            <>
                <H3>Growth Mindset</H3>
                <P>
                    We believe learning and continuous improvement create
                    long-term success.
                </P>
                <H3>Opportunity for Everyone</H3>
                <P>
                    Talent exists everywhere, and everyone deserves access to
                    meaningful opportunities.
                </P>
                <H3>Practical Experience</H3>
                <P>
                    Real-world experience plays a critical role in professional
                    development.
                </P>
                <H3>Transparency</H3>
                <P>
                    Trust is built through clear communication and honest
                    interactions.
                </P>
                <H3>Innovation</H3>
                <P>
                    We embrace technology and creative solutions to improve
                    career discovery and hiring.
                </P>
                <H3>Community</H3>
                <P>
                    Success grows when students, professionals, founders, and
                    employers support one another.
                </P>
            </>
        ),
    },
    {
        id: "commitment",
        label: "Our Commitment",
        body: (
            <>
                <P>
                    SpiderSkill is committed to helping students and
                    professionals develop skills, discover opportunities, and
                    achieve their career goals. We are equally committed to
                    helping employers and startups connect with talented
                    individuals who can contribute to their growth.
                </P>
                <P>
                    Every feature, resource, and opportunity on our platform is
                    designed with one goal in mind: creating meaningful
                    connections that benefit both talent and organizations.
                </P>
            </>
        ),
    },
    {
        id: "future",
        label: "Building the Future of Career Discovery",
        body: (
            <>
                <P>
                    The world of work is evolving rapidly. New technologies,
                    industries, and career paths are creating opportunities that
                    did not exist a few years ago. SpiderSkill aims to help
                    individuals navigate this changing landscape by providing
                    access to opportunities, career resources, and professional
                    connections.
                </P>
                <P>
                    We believe careers are built through learning, experience,
                    and opportunity — and we are here to help make those
                    opportunities more accessible.
                </P>
            </>
        ),
    },
    {
        id: "join",
        label: "Join the SpiderSkill Community",
        body: (
            <>
                <P>
                    Whether you are a student searching for your first
                    internship, a graduate exploring career opportunities, a
                    founder building a startup, or an employer looking for
                    talent, SpiderSkill is designed to support your journey.
                </P>
                <P>
                    Together, we can create a future where skills, ambition, and
                    opportunity connect seamlessly.
                </P>
            </>
        ),
    },
];

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="About us"
                    title="Connecting Talent with Opportunity"
                    intro={
                        <>
                            <P>
                                SpiderSkill is a career and talent platform
                                built to help students, fresh graduates,
                                startups, founders, and employers connect,
                                collaborate, and grow. We believe that talented
                                individuals deserve access to meaningful
                                opportunities, and organizations deserve access
                                to motivated people who are ready to learn,
                                contribute, and make an impact.
                            </P>
                            <P>
                                Our mission is to bridge the gap between
                                education and industry by creating a platform
                                where opportunities, skills, and ambition come
                                together.
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
