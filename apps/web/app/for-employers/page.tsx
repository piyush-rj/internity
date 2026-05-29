"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        id: "why-hire",
        label: "Why Hire Through SpiderSkill?",
        body: (
            <>
                <P>
                    Finding the right talent can be challenging, especially when
                    you&apos;re looking for candidates who are enthusiastic,
                    adaptable, and ready to contribute. SpiderSkill simplifies
                    the hiring process by connecting employers with ambitious
                    students and early-career professionals actively seeking
                    opportunities.
                </P>
                <P>Our platform is designed to help employers:</P>
                <UL>
                    <li>Reach motivated student talent</li>
                    <li>Hire interns and fresh graduates efficiently</li>
                    <li>
                        Build an employer brand among emerging professionals
                    </li>
                    <li>Post opportunities quickly and easily</li>
                    <li>Discover candidates across multiple skill areas</li>
                    <li>Connect with future long-term team members</li>
                    <li>Support career growth and professional development</li>
                </UL>
            </>
        ),
    },
    {
        id: "post-opportunities",
        label: "Post Opportunities That Attract Talent",
        body: (
            <>
                <P>
                    Employers can create and share a wide range of
                    opportunities, including:
                </P>
                <H3>Internships</H3>
                <P>
                    Connect with students looking to gain practical experience
                    while contributing to real projects.
                </P>
                <H3>Full-Time Roles</H3>
                <P>
                    Hire fresh graduates and entry-level professionals ready to
                    begin their careers.
                </P>
                <H3>Part-Time Opportunities</H3>
                <P>
                    Find candidates who can contribute while balancing academic
                    commitments.
                </P>
                <H3>Freelance Projects</H3>
                <P>
                    Work with skilled students and early professionals on
                    short-term assignments and project-based work.
                </P>
                <H3>Startup Roles</H3>
                <P>
                    Discover ambitious individuals interested in working in
                    fast-paced startup environments.
                </P>
                <H3>Remote Opportunities</H3>
                <P>
                    Reach candidates from different locations and build
                    distributed teams.
                </P>
            </>
        ),
    },
    {
        id: "access-talent",
        label: "Access Emerging Talent",
        body: (
            <>
                <P>
                    SpiderSkill focuses on helping employers connect with
                    individuals who are actively developing their skills and
                    preparing for professional careers. Typical candidate
                    profiles include:
                </P>
                <UL>
                    <li>College students</li>
                    <li>University graduates</li>
                    <li>Final-year students</li>
                    <li>Technical and non-technical candidates</li>
                    <li>Aspiring software developers</li>
                    <li>Designers and creative professionals</li>
                    <li>Marketing enthusiasts</li>
                    <li>Business and operations candidates</li>
                    <li>Content creators and writers</li>
                    <li>Data and analytics learners</li>
                    <li>Startup-focused professionals</li>
                </UL>
            </>
        ),
    },
    {
        id: "employer-brand",
        label: "Build Your Employer Brand",
        body: (
            <>
                <P>
                    A strong employer brand attracts better candidates.
                    SpiderSkill helps organizations showcase their culture,
                    mission, values, and opportunities to students and
                    early-career professionals. Employers can present:
                </P>
                <UL>
                    <li>Company information</li>
                    <li>Team culture</li>
                    <li>Learning opportunities</li>
                    <li>Growth potential</li>
                    <li>Project impact</li>
                    <li>Career progression opportunities</li>
                    <li>Workplace values</li>
                    <li>Mission and vision</li>
                </UL>
                <P>
                    This helps candidates understand what makes your
                    organization unique and encourages stronger applications.
                </P>
            </>
        ),
    },
    {
        id: "benefits",
        label: "Benefits for Employers",
        body: (
            <>
                <H3>Faster Hiring Process</H3>
                <P>
                    Reach relevant candidates without relying solely on
                    traditional recruitment channels.
                </P>
                <H3>Access to Motivated Talent</H3>
                <P>
                    Connect with individuals actively looking to learn, grow,
                    and contribute.
                </P>
                <H3>Cost-Effective Recruitment</H3>
                <P>
                    Discover talent for internships, projects, and entry-level
                    roles without extensive hiring costs.
                </P>
                <H3>Early Talent Pipeline</H3>
                <P>
                    Build relationships with promising candidates before they
                    enter the broader job market.
                </P>
                <H3>Flexible Hiring Options</H3>
                <P>
                    Recruit for internships, freelance projects, part-time work,
                    and full-time positions.
                </P>
                <H3>Startup-Friendly Hiring</H3>
                <P>
                    Perfect for founders and growing businesses looking to build
                    strong teams from the ground up.
                </P>
            </>
        ),
    },
    {
        id: "who-can-use",
        label: "Who Can Use SpiderSkill?",
        body: (
            <>
                <H3>Solo Founders</H3>
                <P>
                    Find interns and early team members to support product
                    development, marketing, operations, and growth.
                </P>
                <H3>Startups</H3>
                <P>
                    Build high-performing teams by connecting with motivated
                    students and fresh graduates.
                </P>
                <H3>Small Businesses</H3>
                <P>
                    Access affordable and enthusiastic talent for a variety of
                    business functions.
                </P>
                <H3>Growing Companies</H3>
                <P>
                    Strengthen your recruitment pipeline and identify future
                    employees.
                </P>
                <H3>Agencies</H3>
                <P>
                    Hire interns, freelancers, and entry-level professionals for
                    client projects.
                </P>
                <H3>Recruiters</H3>
                <P>
                    Expand candidate sourcing efforts by connecting with
                    emerging talent.
                </P>
            </>
        ),
    },
    {
        id: "create-opportunities",
        label: "Create Opportunities That Matter",
        body: (
            <>
                <P>
                    Students and fresh graduates are actively searching for
                    organizations that offer meaningful work, mentorship, skill
                    development, and career growth. Employers who provide
                    valuable learning experiences often attract highly motivated
                    applicants who are eager to contribute.
                </P>
                <P>
                    By creating opportunities through SpiderSkill, employers can
                    help shape future professionals while building stronger
                    teams for their organizations.
                </P>
            </>
        ),
    },
    {
        id: "why-choose",
        label: "Why Employers Choose SpiderSkill",
        body: (
            <UL>
                <li>Access student and fresher talent</li>
                <li>Hire interns and entry-level professionals</li>
                <li>Reach motivated candidates</li>
                <li>Build employer visibility</li>
                <li>Post opportunities quickly</li>
                <li>Support future workforce development</li>
                <li>Connect with startup-minded individuals</li>
                <li>Create meaningful career opportunities</li>
                <li>Build long-term talent pipelines</li>
                <li>Grow your team with emerging professionals</li>
            </UL>
        ),
    },
    {
        id: "mission",
        label: "Our Mission",
        body: (
            <>
                <P>
                    SpiderSkill aims to bridge the gap between employers and
                    emerging talent. We believe that businesses grow faster when
                    they can easily connect with motivated individuals seeking
                    opportunities to learn, contribute, and build successful
                    careers.
                </P>
                <P>
                    Whether you&apos;re a solo founder, startup, agency, or
                    growing company, SpiderSkill provides a platform to discover
                    talent, create opportunities, and build the teams that drive
                    future success.
                </P>
            </>
        ),
    },
];

export default function ForEmployersPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <PolicyLayout
                    eyebrow="For Employers"
                    title="Find Talented Students and Early-Career Professionals"
                    intro={
                        <>
                            <P>
                                SpiderSkill helps employers, startups, founders,
                                recruiters, and growing businesses connect with
                                motivated students, interns, fresh graduates,
                                and emerging talent. Whether you&apos;re hiring
                                for internships, part-time roles, freelance
                                projects, or full-time positions, our platform
                                makes it easier to discover candidates who are
                                eager to learn, contribute, and grow.
                            </P>
                            <P>
                                From early-stage startups to established
                                organizations, SpiderSkill enables employers to
                                build talent pipelines, reach qualified
                                candidates, and create meaningful opportunities
                                for the next generation of professionals.
                            </P>
                        </>
                    }
                    sidebarHeader={
                        <Link
                            href="/home/manage-listings/new"
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors"
                        >
                            Post an internship
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    }
                    sections={SECTIONS}
                />
            </main>
            <Footer />
        </div>
    );
}
