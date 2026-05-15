import { prisma, UserRole, CompanyRole, ListingType, WorkMode } from "./index";

type SeedCompany = {
    slug: string;
    name: string;
    website: string;
    about: string;
    industry: string;
    size: string;
    city: string;
    logoUrl: string;
    employers: SeedEmployer[];
    listings: SeedListing[];
};

type SeedEmployer = {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
    role: CompanyRole;
};

type SeedListing = {
    type: ListingType;
    title: string;
    mode: WorkMode;
    city?: string;
    description: string;
    responsibilities: string[];
    perks: string[];
    preferences: string[];
    skillTagsRaw: string[];
    stipendMin?: number;
    stipendMax?: number;
    durationMonths?: number;
    openings?: number;
    partTime?: boolean;
    applyInDays?: number;
    postedByEmail: string;
};

// Slugs / emails from earlier fictional seed — removed at the start of each run
// so the DB ends up with only the real-company rows below.
const LEGACY_COMPANY_SLUGS = [
    "acme-corp",
    "globex-labs",
    "initech-solutions",
    "umbrella-health",
    "stark-industries",
];

const LEGACY_EMPLOYER_EMAILS = [
    "rohit.sharma@acme.example.com",
    "priya.menon@acme.example.com",
    "ananya.rao@globex.example.com",
    "vikram.iyer@globex.example.com",
    "neha.kapoor@initech.example.com",
    "arjun.patel@initech.example.com",
    "kavya.nair@umbrella.example.com",
    "ishaan.gupta@stark.example.com",
    "meera.joshi@stark.example.com",
    "siddharth.verma@stark.example.com",
];

const companies: SeedCompany[] = [
    {
        slug: "razorpay",
        name: "Razorpay",
        website: "https://razorpay.com",
        about: "India's leading payments and banking platform for businesses of every size.",
        industry: "FinTech",
        size: "1001-5000",
        city: "Bengaluru",
        logoUrl: "/brand-logos/razorpay-logo.png",
        employers: [
            {
                email: "rohit.sharma@razorpay.example.com",
                name: "Rohit Sharma",
                firstName: "Rohit",
                lastName: "Sharma",
                jobTitle: "Head of Talent",
                phone: "+91 9876500001",
                role: CompanyRole.OWNER,
            },
            {
                email: "priya.menon@razorpay.example.com",
                name: "Priya Menon",
                firstName: "Priya",
                lastName: "Menon",
                jobTitle: "Recruiter",
                phone: "+91 9876500002",
                role: CompanyRole.MEMBER,
            },
        ],
        listings: [
            {
                type: ListingType.JOB,
                title: "Backend Engineer",
                mode: WorkMode.HYBRID,
                city: "Bengaluru",
                description:
                    "Build core payment services that move billions of rupees a day. Work closely with infra and product teams to ship reliable systems.",
                responsibilities: [
                    "Design and ship REST APIs in Node.js / TypeScript",
                    "Own service-level reliability and on-call rotation",
                    "Write and review production-grade code",
                ],
                perks: [
                    "Health insurance",
                    "Annual L&D budget",
                    "Flexible hours",
                ],
                preferences: [
                    "1+ years backend experience",
                    "Strong CS fundamentals",
                ],
                skillTagsRaw: ["nodejs", "typescript", "postgres", "aws"],
                stipendMin: 1200000,
                stipendMax: 2200000,
                openings: 3,
                applyInDays: 30,
                postedByEmail: "rohit.sharma@razorpay.example.com",
            },
            {
                type: ListingType.INTERNSHIP,
                title: "Frontend Engineering Intern",
                mode: WorkMode.REMOTE,
                description:
                    "Join the Razorpay dashboard team and ship features that thousands of merchants use every day. Mentorship from senior engineers throughout.",
                responsibilities: [
                    "Implement UI components from Figma designs",
                    "Pair with senior engineers on feature work",
                ],
                perks: ["Stipend", "Certificate", "PPO opportunity"],
                preferences: [
                    "Good with React + TS",
                    "Available 5 days a week",
                ],
                skillTagsRaw: ["react", "typescript", "tailwind"],
                stipendMin: 30000,
                stipendMax: 45000,
                durationMonths: 6,
                openings: 2,
                applyInDays: 21,
                postedByEmail: "priya.menon@razorpay.example.com",
            },
        ],
    },
    {
        slug: "microsoft",
        name: "Microsoft",
        website: "https://microsoft.com",
        about: "Cloud, AI and developer tools built out of our Hyderabad India Development Center.",
        industry: "Cloud / AI",
        size: "10000+",
        city: "Hyderabad",
        logoUrl: "/brand-logos/microsoft.png",
        employers: [
            {
                email: "ananya.rao@microsoft.example.com",
                name: "Ananya Rao",
                firstName: "Ananya",
                lastName: "Rao",
                jobTitle: "Engineering Manager, Azure AI",
                phone: "+91 9876500011",
                role: CompanyRole.OWNER,
            },
            {
                email: "vikram.iyer@microsoft.example.com",
                name: "Vikram Iyer",
                firstName: "Vikram",
                lastName: "Iyer",
                jobTitle: "University Recruiter",
                phone: "+91 9876500012",
                role: CompanyRole.MEMBER,
            },
        ],
        listings: [
            {
                type: ListingType.JOB,
                title: "Machine Learning Engineer",
                mode: WorkMode.ONSITE,
                city: "Hyderabad",
                description:
                    "Work on production ML pipelines that power Microsoft 365 ranking and personalisation. Strong applied ML focus.",
                responsibilities: [
                    "Train, evaluate and deploy ML models",
                    "Build feature pipelines and offline evaluation",
                    "Collaborate with research and product",
                ],
                perks: ["ESPP", "Conference budget", "Top-tier hardware"],
                preferences: [
                    "2+ years applied ML",
                    "Comfortable with Python + PyTorch",
                ],
                skillTagsRaw: ["python", "pytorch", "ml", "sql"],
                stipendMin: 2500000,
                stipendMax: 4500000,
                openings: 2,
                applyInDays: 45,
                postedByEmail: "ananya.rao@microsoft.example.com",
            },
            {
                type: ListingType.INTERNSHIP,
                title: "Applied AI Research Intern",
                mode: WorkMode.HYBRID,
                city: "Hyderabad",
                description:
                    "Prototype and benchmark new model architectures inside an Azure AI team. You will publish internal write-ups and ship a small production experiment by end of internship.",
                responsibilities: [
                    "Run experiments with reproducible scripts",
                    "Read and summarise recent papers",
                    "Pair with senior engineers on a shippable prototype",
                ],
                perks: [
                    "Stipend",
                    "PPO opportunity",
                    "Author credit on write-ups",
                ],
                preferences: [
                    "Strong fundamentals in ML",
                    "Comfort with Python notebooks",
                ],
                skillTagsRaw: ["python", "pytorch", "research"],
                stipendMin: 80000,
                stipendMax: 100000,
                durationMonths: 4,
                openings: 1,
                applyInDays: 30,
                postedByEmail: "ananya.rao@microsoft.example.com",
            },
        ],
    },
    {
        slug: "zoho",
        name: "Zoho",
        website: "https://zoho.com",
        about: "A privately-held suite of business software, built in India for the world.",
        industry: "SaaS",
        size: "10000+",
        city: "Chennai",
        logoUrl: "/brand-logos/zoho.jpeg",
        employers: [
            {
                email: "neha.kapoor@zoho.example.com",
                name: "Neha Kapoor",
                firstName: "Neha",
                lastName: "Kapoor",
                jobTitle: "VP People",
                phone: "+91 9876500021",
                role: CompanyRole.OWNER,
            },
            {
                email: "arjun.patel@zoho.example.com",
                name: "Arjun Patel",
                firstName: "Arjun",
                lastName: "Patel",
                jobTitle: "Engineering Manager, Zoho CRM",
                phone: "+91 9876500022",
                role: CompanyRole.MEMBER,
            },
        ],
        listings: [
            {
                type: ListingType.JOB,
                title: "Full-Stack Engineer",
                mode: WorkMode.HYBRID,
                city: "Chennai",
                description:
                    "Own end-to-end features across our React frontend and Java backend. You'll ship to thousands of business customers from day one.",
                responsibilities: [
                    "Build features across the stack",
                    "Write tests and own quality",
                    "Participate in product discovery",
                ],
                perks: [
                    "Medical insurance",
                    "Hybrid setup",
                    "Quarterly offsites",
                ],
                preferences: [
                    "1+ year of full-stack experience",
                    "Familiarity with relational DBs",
                ],
                skillTagsRaw: ["react", "java", "typescript", "postgres"],
                stipendMin: 900000,
                stipendMax: 1600000,
                openings: 4,
                applyInDays: 30,
                postedByEmail: "neha.kapoor@zoho.example.com",
            },
            {
                type: ListingType.JOB,
                title: "Product Designer",
                mode: WorkMode.REMOTE,
                description:
                    "Lead design for a new product surface targeted at finance teams. Work directly with the head of product and engineering.",
                responsibilities: [
                    "Own design end-to-end for one product surface",
                    "Run user research and usability tests",
                ],
                perks: ["Remote-friendly", "Annual hardware budget"],
                preferences: ["Portfolio with shipped B2B work"],
                skillTagsRaw: ["figma", "user research", "design systems"],
                stipendMin: 1200000,
                stipendMax: 2000000,
                openings: 1,
                applyInDays: 35,
                postedByEmail: "arjun.patel@zoho.example.com",
            },
            {
                type: ListingType.INTERNSHIP,
                title: "QA Automation Intern",
                mode: WorkMode.REMOTE,
                description:
                    "Help us build out our automated test suite for a Zoho product. You'll work alongside engineers and own a meaningful slice of the test pyramid.",
                responsibilities: [
                    "Write Playwright end-to-end tests",
                    "Triage and reproduce reported bugs",
                ],
                perks: ["Stipend", "Letter of recommendation"],
                preferences: ["Comfort with TypeScript", "Detail-oriented"],
                skillTagsRaw: ["playwright", "typescript", "testing"],
                stipendMin: 20000,
                stipendMax: 25000,
                durationMonths: 3,
                openings: 2,
                applyInDays: 21,
                postedByEmail: "arjun.patel@zoho.example.com",
            },
        ],
    },
    {
        slug: "pharmeasy",
        name: "PharmEasy",
        website: "https://pharmeasy.in",
        about: "Digital-first healthcare and diagnostics platform serving households across India.",
        industry: "HealthTech",
        size: "1001-5000",
        city: "Mumbai",
        logoUrl: "/brand-logos/pharmeasy.jpeg",
        employers: [
            {
                email: "kavya.nair@pharmeasy.example.com",
                name: "Kavya Nair",
                firstName: "Kavya",
                lastName: "Nair",
                jobTitle: "Director, Engineering",
                phone: "+91 9876500031",
                role: CompanyRole.OWNER,
            },
        ],
        listings: [
            {
                type: ListingType.JOB,
                title: "Mobile Engineer (React Native)",
                mode: WorkMode.REMOTE,
                description:
                    "Build the patient-facing mobile app used across India for medicines and diagnostics. Significant ownership from day one.",
                responsibilities: [
                    "Own large parts of the React Native codebase",
                    "Ship features end-to-end",
                ],
                perks: ["Health insurance for family", "Remote-first"],
                preferences: ["1+ year shipping React Native apps"],
                skillTagsRaw: ["react native", "typescript", "mobile"],
                stipendMin: 1100000,
                stipendMax: 1900000,
                openings: 1,
                applyInDays: 30,
                postedByEmail: "kavya.nair@pharmeasy.example.com",
            },
            {
                type: ListingType.INTERNSHIP,
                title: "Content & Community Intern",
                mode: WorkMode.HYBRID,
                city: "Mumbai",
                description:
                    "Drive content for our preventive-health blog and run our growing online community.",
                responsibilities: [
                    "Publish 2 blog posts per week",
                    "Moderate community discussions",
                ],
                perks: ["Stipend", "Certificate", "Flexible hours"],
                preferences: [
                    "Strong written English",
                    "Interest in healthcare",
                ],
                skillTagsRaw: ["content writing", "community", "social media"],
                stipendMin: 12000,
                stipendMax: 18000,
                durationMonths: 3,
                openings: 1,
                partTime: true,
                applyInDays: 21,
                postedByEmail: "kavya.nair@pharmeasy.example.com",
            },
        ],
    },
    {
        slug: "ather-energy",
        name: "Ather Energy",
        website: "https://atherenergy.com",
        about: "India's home-grown intelligent electric vehicle company, designing scooters and the chargers that power them.",
        industry: "Hardware / EV",
        size: "1001-5000",
        city: "Bengaluru",
        logoUrl: "/brand-logos/ather.png",
        employers: [
            {
                email: "ishaan.gupta@ather.example.com",
                name: "Ishaan Gupta",
                firstName: "Ishaan",
                lastName: "Gupta",
                jobTitle: "Director of Hiring",
                phone: "+91 9876500041",
                role: CompanyRole.OWNER,
            },
            {
                email: "meera.joshi@ather.example.com",
                name: "Meera Joshi",
                firstName: "Meera",
                lastName: "Joshi",
                jobTitle: "Talent Partner",
                phone: "+91 9876500042",
                role: CompanyRole.MEMBER,
            },
            {
                email: "siddharth.verma@ather.example.com",
                name: "Siddharth Verma",
                firstName: "Siddharth",
                lastName: "Verma",
                jobTitle: "Hiring Coordinator",
                phone: "+91 9876500043",
                role: CompanyRole.MEMBER,
            },
        ],
        listings: [
            {
                type: ListingType.JOB,
                title: "Embedded Systems Engineer",
                mode: WorkMode.ONSITE,
                city: "Bengaluru",
                description:
                    "Design firmware for the on-board controllers across our scooter and AtherGrid charger lineup.",
                responsibilities: [
                    "Write firmware in C / C++",
                    "Bring up new hardware revisions",
                    "Debug field-reported issues",
                ],
                perks: ["Relocation support", "On-site canteen", "Insurance"],
                preferences: [
                    "2+ years embedded experience",
                    "Comfort with RTOS",
                ],
                skillTagsRaw: ["c", "c++", "embedded", "rtos"],
                stipendMin: 1500000,
                stipendMax: 2500000,
                openings: 2,
                applyInDays: 45,
                postedByEmail: "ishaan.gupta@ather.example.com",
            },
            {
                type: ListingType.JOB,
                title: "Data Engineer",
                mode: WorkMode.HYBRID,
                city: "Bengaluru",
                description:
                    "Build and operate the data platform that powers fleet analytics across our scooter network.",
                responsibilities: [
                    "Build batch and streaming pipelines",
                    "Own data quality and lineage",
                ],
                perks: ["Hybrid setup", "Conference budget"],
                preferences: ["Familiarity with Spark/Kafka", "Strong SQL"],
                skillTagsRaw: ["python", "spark", "kafka", "sql"],
                stipendMin: 1400000,
                stipendMax: 2200000,
                openings: 2,
                applyInDays: 30,
                postedByEmail: "meera.joshi@ather.example.com",
            },
            {
                type: ListingType.INTERNSHIP,
                title: "Hardware Design Intern",
                mode: WorkMode.ONSITE,
                city: "Bengaluru",
                description:
                    "Work alongside our hardware team on schematic capture and PCB layout for the next charger revision.",
                responsibilities: [
                    "Assist with schematic and PCB design",
                    "Bring up prototype boards",
                ],
                perks: ["Stipend", "PPO opportunity", "Lab access"],
                preferences: ["Final-year ECE students preferred"],
                skillTagsRaw: ["altium", "pcb", "electronics"],
                stipendMin: 25000,
                stipendMax: 35000,
                durationMonths: 6,
                openings: 1,
                applyInDays: 30,
                postedByEmail: "siddharth.verma@ather.example.com",
            },
        ],
    },
];

async function seed() {
    console.log("Seeding companies, employees and listings...");

    const removedCompanies = await prisma.company.deleteMany({
        where: { slug: { in: LEGACY_COMPANY_SLUGS } },
    });
    const removedUsers = await prisma.user.deleteMany({
        where: { email: { in: LEGACY_EMPLOYER_EMAILS } },
    });
    if (removedCompanies.count || removedUsers.count) {
        console.log(
            `  cleaned up ${removedCompanies.count} legacy company row(s) and ${removedUsers.count} legacy employer user(s)`,
        );
    }

    let createdCompanies = 0;
    let createdEmployers = 0;
    let createdListings = 0;

    for (const c of companies) {
        const company = await prisma.company.upsert({
            where: { slug: c.slug },
            update: {
                name: c.name,
                website: c.website,
                about: c.about,
                industry: c.industry,
                size: c.size,
                city: c.city,
                logoUrl: c.logoUrl,
            },
            create: {
                slug: c.slug,
                name: c.name,
                website: c.website,
                about: c.about,
                industry: c.industry,
                size: c.size,
                city: c.city,
                logoUrl: c.logoUrl,
            },
        });
        createdCompanies++;

        for (const e of c.employers) {
            const user = await prisma.user.upsert({
                where: { email: e.email },
                update: {
                    name: e.name,
                    role: UserRole.EMPLOYER,
                },
                create: {
                    email: e.email,
                    name: e.name,
                    role: UserRole.EMPLOYER,
                    employerProfile: {
                        create: {
                            firstName: e.firstName,
                            lastName: e.lastName,
                            jobTitle: e.jobTitle,
                            phone: e.phone,
                        },
                    },
                },
            });

            await prisma.employerProfile.upsert({
                where: { userId: user.id },
                update: {
                    firstName: e.firstName,
                    lastName: e.lastName,
                    jobTitle: e.jobTitle,
                    phone: e.phone,
                },
                create: {
                    userId: user.id,
                    firstName: e.firstName,
                    lastName: e.lastName,
                    jobTitle: e.jobTitle,
                    phone: e.phone,
                },
            });

            await prisma.companyMember.upsert({
                where: {
                    companyId_userId: {
                        companyId: company.id,
                        userId: user.id,
                    },
                },
                update: { role: e.role },
                create: {
                    companyId: company.id,
                    userId: user.id,
                    role: e.role,
                },
            });

            createdEmployers++;
        }

        const employerByEmail = new Map<string, string>();
        const employers = await prisma.user.findMany({
            where: { email: { in: c.employers.map((e) => e.email) } },
            select: { id: true, email: true },
        });
        for (const e of employers) employerByEmail.set(e.email, e.id);

        let companyListingCount = 0;
        for (const l of c.listings) {
            const postedById = employerByEmail.get(l.postedByEmail);
            if (!postedById) {
                throw new Error(
                    `Listing "${l.title}" references unseeded employer ${l.postedByEmail}`,
                );
            }

            const existing = await prisma.listing.findFirst({
                where: {
                    companyId: company.id,
                    title: l.title,
                    type: l.type,
                },
                select: { id: true },
            });

            const applyBy = l.applyInDays
                ? new Date(Date.now() + l.applyInDays * 24 * 60 * 60 * 1000)
                : undefined;

            const data = {
                companyId: company.id,
                postedById,
                type: l.type,
                title: l.title,
                mode: l.mode,
                city: l.city ?? null,
                description: l.description,
                responsibilities: l.responsibilities,
                perks: l.perks,
                preferences: l.preferences,
                skillTagsRaw: l.skillTagsRaw,
                stipendMin: l.stipendMin ?? null,
                stipendMax: l.stipendMax ?? null,
                durationMonths: l.durationMonths ?? null,
                openings: l.openings ?? 1,
                partTime: l.partTime ?? false,
                applyBy: applyBy ?? null,
            };

            if (existing) {
                await prisma.listing.update({
                    where: { id: existing.id },
                    data,
                });
            } else {
                await prisma.listing.create({ data });
                createdListings++;
            }
            companyListingCount++;
        }

        console.log(
            `  ${c.name} — ${c.employers.length} employee${c.employers.length === 1 ? "" : "s"}, ${companyListingCount} listing${companyListingCount === 1 ? "" : "s"}`,
        );
    }

    console.log(
        `\nSeed complete: ${createdCompanies} companies, ${createdEmployers} employees, ${createdListings} new listings.`,
    );
}

seed()
    .catch((err) => {
        console.error("Seed failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
