// Long-form platform instructions surfaced under /home/instructions for
// both audiences. Each section has a stable `id` so deep-links from short
// tips elsewhere in the app (post-listing form, onboarding, etc.) can jump
// directly to the relevant paragraph.

export type InstructionSection = {
    id: string;
    title: string;
    // Each entry renders as a short paragraph; the array form keeps line
    // wrapping under our control so we don't have to re-flow a long
    // template literal.
    body: string[];
};

export const STUDENT_INSTRUCTIONS: ReadonlyArray<InstructionSection> = [
    {
        id: "complete-profile",
        title: "Complete your profile",
        body: [
            "Add your resume, skills, LinkedIn, portfolio or GitHub links, and any projects you've worked on.",
            "A complete profile helps founders understand your strengths and increases your chances of getting noticed.",
        ],
    },
    {
        id: "apply-thoughtfully",
        title: "Apply thoughtfully",
        body: [
            "Read each internship carefully and apply only to roles that genuinely match your interests and skills.",
            "Focused applications consistently outperform mass applications.",
        ],
    },
    {
        id: "keep-updated",
        title: "Keep your profile updated",
        body: [
            "Refresh your skills, projects, experience, and resume regularly.",
            "An up-to-date profile gets better visibility and shows founders you're actively growing.",
        ],
    },
    {
        id: "communicate-professionally",
        title: "Communicate professionally",
        body: [
            "Keep your conversations with founders clear, respectful, and timely.",
            "Good communication leaves a strong impression and can make the difference during the hiring process.",
        ],
    },
    {
        id: "stay-active",
        title: "Stay active on the platform",
        body: [
            "Check your dashboard, emails, and messages regularly for application updates, shortlist notifications, and interview invitations.",
            "Opportunities move fast. Staying active keeps you ahead.",
        ],
    },
    {
        id: "build-portfolio",
        title: "Build your portfolio",
        body: [
            "Every project counts: a college assignment, a personal build, an open-source contribution, or a hackathon submission.",
            "Add it to your profile and let your work speak for itself.",
        ],
    },
    {
        id: "open-to-opportunities",
        title: "Be open to different opportunities",
        body: [
            "SpiderSkill features internships from startups, solo founders, bootstrapped companies, and growing teams.",
            "Learning-focused roles at early-stage companies often give you more hands-on experience than anywhere else.",
        ],
    },
    {
        id: "keep-growing",
        title: "Keep growing",
        body: [
            "Internships are about more than just getting selected.",
            "They're a chance to pick up real industry skills, build meaningful connections, and grow as a professional. Make the most of every opportunity.",
        ],
    },
    {
        id: "accurate-info",
        title: "Use accurate information",
        body: [
            "A genuine, accurate profile builds trust with founders and improves how well your applications are matched to the right opportunities.",
        ],
    },
];

export const EMPLOYER_INSTRUCTIONS: ReadonlyArray<InstructionSection> = [
    {
        id: "clear-listings",
        title: "Create clear listings",
        body: [
            "Describe the role's responsibilities, required skills, duration, stipend, work type, and what you expect from the intern.",
            "A well-written listing attracts the right applicants and saves you time during review.",
        ],
    },
    {
        id: "competitive-stipends",
        title: "Offer competitive stipends",
        body: [
            "A fair stipend signals that you value the intern's time and contribution.",
            "Higher stipends generally bring in more applicants and stronger candidate quality.",
        ],
    },
    {
        id: "respond-promptly",
        title: "Respond to applicants promptly",
        body: [
            "Timely, clear communication creates a great hiring experience for candidates.",
            "It also builds your reputation as a founder worth working with.",
        ],
    },
    {
        id: "review-profiles",
        title: "Review profiles carefully",
        body: [
            "Look beyond grades. Explore skills, projects, portfolios, and how candidates communicate.",
            "Early-stage talent grows fast with the right guidance and environment.",
        ],
    },
    {
        id: "keep-listings-updated",
        title: "Keep your listings updated",
        body: [
            "Once a position is filled, mark it closed or paused from your dashboard.",
            "This keeps the experience smooth for applicants and your pipeline clean.",
        ],
    },
    {
        id: "transparent-hiring",
        title: "Be transparent in your hiring",
        body: [
            "Clear expectations, honest communication, and consistent follow-through build lasting trust with candidates.",
            "That trust compounds into a strong employer brand on SpiderSkill.",
        ],
    },
    {
        id: "support-growth",
        title: "Support learning and growth",
        body: [
            "Many students are stepping into the professional world for the first time.",
            "A positive internship experience helps them contribute better to your team and grow alongside your company.",
        ],
    },
    {
        id: "diverse-talent",
        title: "Explore talent from all backgrounds",
        body: [
            "SpiderSkill brings in applicants from diverse colleges, skill levels, and learning paths.",
            "Great talent comes from unexpected places. Keep an open mind when reviewing profiles.",
        ],
    },
];
