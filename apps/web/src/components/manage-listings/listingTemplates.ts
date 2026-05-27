import type { JobTitle, WorkMode } from "@/src/lib/api";

export type ListingTemplate = {
    key: string;
    label: string;
    category: string;
    jobTitle: JobTitle | null;
    mode: WorkMode;
    title: string;
    description: string;
    responsibilities: string[];
    preferences: string[];
    perks: string[];
    skillTags: string[];
    screeningQuestions?: string[];
};

const COMMON_PERKS = [
    "Flexible hours",
    "Certificate on completion",
    "Letter of recommendation",
];

const COMMON_QUESTIONS = [
    "What recent project of yours would you most like to talk about?",
    "When can you start, and how many hours per week are you available?",
];

export const LISTING_TEMPLATES: ListingTemplate[] = [
    {
        key: "ai-developer",
        label: "AI Developer",
        category: "Technical",
        jobTitle: "AI",
        mode: "REMOTE",
        title: "AI Developer Intern",
        description:
            "Help us ship LLM-powered features end-to-end — prototyping with state-of-the-art models, building retrieval pipelines, and turning experiments into production code.",
        responsibilities: [
            "Prototype with LLMs (OpenAI / Anthropic / open-source) and ship the winning ideas",
            "Build retrieval and embedding pipelines",
            "Write small services that other teams can call",
            "Evaluate model outputs and iterate on prompts",
        ],
        preferences: [
            "Python plus one of TypeScript / Go",
            "Comfortable reading recent ML papers",
            "Has shipped at least one project using an LLM API",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Python", "LLMs", "PyTorch", "Vector DB", "FastAPI"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "backend-developer",
        label: "Backend Developer",
        category: "Technical",
        jobTitle: "BACKEND",
        mode: "REMOTE",
        title: "Backend Developer Intern",
        description:
            "Build and own backend services that power the product. You'll model data, design APIs, and ship features that real users hit every day.",
        responsibilities: [
            "Design and implement REST/JSON APIs",
            "Model data with PostgreSQL and Prisma (or similar)",
            "Write tests and ship with CI/CD",
            "Help debug production incidents",
        ],
        preferences: [
            "Node.js / TypeScript or Python",
            "Comfortable with SQL and relational modelling",
            "Familiar with Git and code review",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Node.js", "TypeScript", "PostgreSQL", "REST", "Git"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "web-app-developer",
        label: "Web App Developer",
        category: "Technical",
        jobTitle: "WEB",
        mode: "REMOTE",
        title: "Web App Developer Intern",
        description:
            "Build polished, fast web experiences end-to-end. You'll work across React, design tokens, and APIs to ship features users love.",
        responsibilities: [
            "Build React components and pages from designs",
            "Wire up APIs and handle loading / error states",
            "Care about performance, accessibility, and small interaction details",
        ],
        preferences: [
            "React + TypeScript",
            "Comfortable with Tailwind or styled-components",
            "Has a portfolio link or shipped side project",
        ],
        perks: COMMON_PERKS,
        skillTags: ["React", "TypeScript", "Next.js", "Tailwind", "REST"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "mobile-app-developer",
        label: "Mobile App Developer",
        category: "Technical",
        jobTitle: "MOBILE",
        mode: "REMOTE",
        title: "Mobile App Developer Intern",
        description:
            "Help us build a delightful native experience on iOS and Android. You'll own features end-to-end and ship to real users every sprint.",
        responsibilities: [
            "Build React Native / Flutter screens from designs",
            "Wire APIs and handle device-specific edge cases",
            "Ship to TestFlight / Play internal track and gather feedback",
        ],
        preferences: [
            "React Native or Flutter experience",
            "Has shipped at least one app or significant feature",
        ],
        perks: COMMON_PERKS,
        skillTags: ["React Native", "Flutter", "TypeScript", "Mobile"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "qa-engineer",
        label: "QA Engineer",
        category: "Technical",
        jobTitle: "QA",
        mode: "REMOTE",
        title: "QA Engineer Intern",
        description:
            "Be the safety net for everything we ship. Design test plans, automate flows, and dig into bugs to make the product feel rock solid.",
        responsibilities: [
            "Write and maintain end-to-end test suites (Playwright / Cypress)",
            "Triage and reproduce bug reports",
            "Pair with engineers on release sign-offs",
        ],
        preferences: [
            "Strong attention to detail",
            "Comfortable with JavaScript / TypeScript",
            "Familiar with Git",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Playwright", "Cypress", "Testing", "TypeScript"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "ui-ux-designer",
        label: "UI/UX Designer",
        category: "Design & Product",
        jobTitle: "DESIGN",
        mode: "REMOTE",
        title: "UI/UX Designer Intern",
        description:
            "Shape the look, feel, and flow of our product. Translate ambiguous problems into clean, considered designs that engineers can build.",
        responsibilities: [
            "Wireframe and prototype new features in Figma",
            "Iterate on flows with user feedback",
            "Maintain and grow the design system",
        ],
        preferences: [
            "Strong Figma fluency",
            "A portfolio showing finished, shipped work",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Figma", "UI Design", "Prototyping", "Design Systems"],
        screeningQuestions: [
            "Share a link to your portfolio.",
            "Describe a recent project where you pushed back on a requirement and why.",
        ],
    },
    {
        key: "product-manager",
        label: "Product Manager",
        category: "Design & Product",
        jobTitle: "PRODUCT",
        mode: "REMOTE",
        title: "Product Manager Intern",
        description:
            "Own a small slice of the product. Talk to users, write specs, and drive the team to ship the right things in the right order.",
        responsibilities: [
            "Run user interviews and synthesise insights",
            "Write concise specs and acceptance criteria",
            "Track release outcomes and follow up on what moved metrics",
        ],
        preferences: [
            "Strong written communication",
            "Comfortable working with data",
            "Has shipped or led at least one project end-to-end",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Product Management", "Research", "Analytics", "Specs"],
        screeningQuestions: [
            "Walk us through a product decision you made and the trade-offs.",
            ...COMMON_QUESTIONS,
        ],
    },
    {
        key: "product-researcher",
        label: "Product Researcher",
        category: "Design & Product",
        jobTitle: "PRODUCT",
        mode: "REMOTE",
        title: "Product Researcher Intern",
        description:
            "Help us understand our users deeply. Run interviews, analyse behaviour, and turn what you learn into clear recommendations.",
        responsibilities: [
            "Plan and run user interviews",
            "Synthesise qualitative findings into themes",
            "Pair with PMs and designers on follow-ups",
        ],
        preferences: [
            "Empathy and patient interviewing skills",
            "Strong writer — clear, brief notes",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Research", "Interviewing", "Analytics", "Writing"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "marketing-specialist",
        label: "Marketing Specialist",
        category: "Marketing & Content",
        jobTitle: "MARKETING",
        mode: "REMOTE",
        title: "Marketing Specialist Intern",
        description:
            "Drive top-of-funnel growth. Test channels, measure what works, and double down on the winners.",
        responsibilities: [
            "Plan and run growth experiments across channels",
            "Track campaign performance and report weekly",
            "Write copy and briefs for content and ads",
        ],
        preferences: [
            "Sharp written communication",
            "Comfortable with spreadsheets and basic analytics",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Marketing", "Growth", "Analytics", "Copywriting"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "content-writer",
        label: "Content Writer",
        category: "Marketing & Content",
        jobTitle: "CONTENT",
        mode: "REMOTE",
        title: "Content Writer Intern",
        description:
            "Write content that ranks, teaches, and converts. Long-form, short-form, social — you'll touch it all.",
        responsibilities: [
            "Write blog posts, landing-page copy, and social posts",
            "Research topics and interview internal experts",
            "Edit and polish content from others",
        ],
        preferences: [
            "Excellent writing — please share samples",
            "Curious; comfortable researching new topics",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Writing", "Editing", "SEO", "Research"],
        screeningQuestions: [
            "Share 2 writing samples (links or PDFs).",
            ...COMMON_QUESTIONS,
        ],
    },
    {
        key: "video-editor",
        label: "Video Editor",
        category: "Marketing & Content",
        jobTitle: "CONTENT",
        mode: "REMOTE",
        title: "Video Editor Intern",
        description:
            "Cut compelling short-form and long-form video. Punch up our YouTube, drive shorts, and ship clips that get watched.",
        responsibilities: [
            "Edit raw footage into polished short and long-form video",
            "Add captions, motion graphics, and music",
            "Maintain a consistent visual brand",
        ],
        preferences: [
            "Fluent in DaVinci Resolve / Premiere / Final Cut",
            "Eye for pacing — link a reel or 2-3 sample edits",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Video Editing", "Premiere", "DaVinci", "Motion Graphics"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "social-media-manager",
        label: "Social Media Manager",
        category: "Marketing & Content",
        jobTitle: "MARKETING",
        mode: "REMOTE",
        title: "Social Media Manager Intern",
        description:
            "Own our social presence. Plan calendars, write posts, jump on trends, and grow the followers that matter.",
        responsibilities: [
            "Plan and post across LinkedIn, Twitter/X, Instagram",
            "Engage with community and reply to mentions",
            "Track what works and double down",
        ],
        preferences: [
            "Online-native; understands platform-specific norms",
            "Sharp written voice",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Social Media", "Copywriting", "Community", "Analytics"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "sales-bd",
        label: "Sales / BD",
        category: "Business & Analytics",
        jobTitle: "SALES",
        mode: "REMOTE",
        title: "Sales / Business Development Intern",
        description:
            "Find the right customers, start good conversations, and close. You'll work directly with founders on the pipeline.",
        responsibilities: [
            "Research target accounts and contacts",
            "Run outbound campaigns and book meetings",
            "Follow up and move deals through the pipeline",
        ],
        preferences: [
            "Comfortable with cold outreach",
            "Crisp writing and a good ear on calls",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Sales", "BD", "Outreach", "CRM"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "data-analyst",
        label: "Data Analyst",
        category: "Business & Analytics",
        jobTitle: "DATA",
        mode: "REMOTE",
        title: "Data Analyst Intern",
        description:
            "Turn raw data into decisions. Write queries, build dashboards, and surface insights the whole team relies on.",
        responsibilities: [
            "Write SQL and build dashboards in Metabase / Looker / similar",
            "Investigate metric changes and explain them",
            "Pair with PMs on experiment design and read-outs",
        ],
        preferences: [
            "Fluent SQL",
            "Comfortable with Python / pandas for one-off analyses",
            "Statistically literate",
        ],
        perks: COMMON_PERKS,
        skillTags: ["SQL", "Python", "Analytics", "Dashboards"],
        screeningQuestions: COMMON_QUESTIONS,
    },
    {
        key: "human-resources",
        label: "Human Resources",
        category: "Business & Analytics",
        jobTitle: "HR",
        mode: "REMOTE",
        title: "Human Resources Intern",
        description:
            "Help the team run well. Own recruiting pipelines, onboarding, and the small things that make a workplace good.",
        responsibilities: [
            "Source and screen candidates",
            "Coordinate interviews and onboarding",
            "Help with HR ops — policies, benefits, culture rituals",
        ],
        preferences: [
            "Empathetic and well-organised",
            "Strong written communication",
        ],
        perks: COMMON_PERKS,
        skillTags: ["Recruiting", "HR", "Operations", "Onboarding"],
        screeningQuestions: COMMON_QUESTIONS,
    },
];

export const TEMPLATE_CATEGORIES = Array.from(
    new Set(LISTING_TEMPLATES.map((t) => t.category)),
);
