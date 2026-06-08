// shared shapes kept in sync with the prisma schema

export type UserRole = "STUDENT" | "EMPLOYER" | "ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";
export type JobTitle =
    | "AI"
    | "BACKEND"
    | "WEB"
    | "MOBILE"
    | "QA"
    | "DESIGN"
    | "PRODUCT"
    | "RESEARCHER"
    | "MARKETING"
    | "CONTENT"
    | "VIDEO"
    | "SALES"
    | "SOCIAL"
    | "DATA"
    | "HR"
    | "CUSTOM";
export type OrganizationType =
    | "SOLO_FOUNDER"
    | "STARTUP_TEAM"
    | "BOOTSTRAPPED_STARTUP"
    | "PRIVATE_LIMITED"
    | "LLP"
    | "AGENCY"
    | "FREELANCER"
    | "STUDENT_STARTUP"
    | "OTHER";
export type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW"
    | "HIRED"
    | "REJECTED"
    | "WITHDRAWN";
// Mirrors the server CompanyRole enum. Legacy `OWNER` rows are emitted by
// the server only if the data migration hasn't run yet — UI should treat
// OWNER and FOUNDER_OWNER as the same seat.
export type CompanyRole =
    | "FOUNDER_OWNER"
    | "CO_FOUNDER"
    | "HR"
    | "MEMBER"
    | "OTHER"
    | "OWNER";
export type CompanyVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AssetKind = "RESUME" | "COMPANY_LOGO" | "PROFILE_IMAGE";
export type ReportTargetType = "LISTING" | "STUDENT";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export type ScreeningResponseType =
    | "SHORT"
    | "YES_NO"
    | "MULTIPLE_CHOICE"
    | "NUMBERS"
    | "SCALE_1_5";

export type ScreeningQuestion =
    | { q: string; type: "SHORT" }
    | { q: string; type: "YES_NO"; idealAnswer?: "yes" | "no" | null }
    | { q: string; type: "MULTIPLE_CHOICE"; options: string[] }
    | { q: string; type: "NUMBERS"; idealMin?: number | null }
    | { q: string; type: "SCALE_1_5"; idealMin?: number | null };

export type ScreeningAnswer = { value: string | number };

export type User = {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Education = {
    id: string;
    studentId: string;
    institute: string;
    degree: string;
    fieldOfStudy: string | null;
    startYear: number;
    endYear: number | null;
    grade: string | null;
    current: boolean;
};

export type WorkExperience = {
    id: string;
    studentId: string;
    company: string;
    title: string;
    location: string | null;
    startDate: string;
    endDate: string | null;
    current: boolean;
    description: string | null;
};

export type Project = {
    id: string;
    studentId: string;
    title: string;
    link: string | null;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
};

export type Skill = { id: string; name: string };
export type StudentSkill = {
    studentId: string;
    skillId: string;
    level: number | null;
    skill: Skill;
};

export type Certification = {
    id: string;
    studentId: string;
    name: string;
    issuer: string | null;
    issueDate: string | null;
    credentialUrl: string | null;
};

export type Language = {
    id: string;
    studentId: string;
    name: string;
    proficiency: number | null;
};

export type Resume = {
    id: string;
    studentId: string;
    assetId: string | null;
    fileName: string;
    url: string;
    sizeBytes: number | null;
    isDefault: boolean;
    lastUsedAt: string | null;
    createdAt: string;
};

export type StudentProfile = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    city: string | null;
    dob: string | null;
    gender: Gender | null;
    bio: string | null;
    resumeUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    college: string | null;
    branch: string | null;
    isVerified: boolean;
    interestedJobTitles: JobTitle[];
    lastCoverLetter: string | null;
    educations: Education[];
    experiences: WorkExperience[];
    projects: Project[];
    skills: StudentSkill[];
    certifications: Certification[];
    languages: Language[];
    resumes?: Resume[];
};

export type EmployerProfile = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    jobTitle: string | null;
    linkedinUrl: string | null;
    country: string | null;
};

export type Company = {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    website: string | null;
    linkedinUrl: string | null;
    about: string | null;
    industry: string | null;
    size: string | null;
    city: string | null;
    country: string | null;
    foundingYear: number | null;
    organizationType: OrganizationType | null;
    verificationStatus: CompanyVerificationStatus;
    rejectionNote: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    // Subscription fields — set when the company pays for a plan.
    isPremium: boolean;
    premiumSince: string | null;
    premiumUntil: string | null;
    activePlanCode: string | null;
    freeListingUsed: boolean;
    freePostingGrants?: { grantedPostings: number; usedPostings: number }[];
};

export type CompanyMember = {
    companyId: string;
    userId: string;
    role: CompanyRole;
    // Free-text label populated only when role = OTHER; null otherwise.
    customRole: string | null;
    joinedAt: string;
};

export type Listing = {
    id: string;
    companyId: string;
    postedById: string;
    title: string;
    mode: WorkMode;
    jobTitle: JobTitle | null;
    customJobTitle: string | null;
    city: string | null;
    description: string;
    responsibilities: string[];
    perks: string[];
    preferences: string[];
    skillTagsRaw: string[];
    screeningQuestions: ScreeningQuestion[];
    stipendMin: number | null;
    stipendMax: number | null;
    currency: string | null;
    durationMonths: number | null;
    durationWeeks: number | null;
    startDate: string | null;
    startDateLatest: string | null;
    applyBy: string | null;
    openings: number | null;
    partTime: boolean;
    ppo: boolean;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    expiresAt: string | null;
    pausedAt: string | null;
    takenDownAt: string | null;
    takedownReason: string | null;
    takenDownById: string | null;
};

export type ListingWithCompany = Listing & {
    company: Pick<
        Company,
        "id" | "name" | "slug" | "logoUrl" | "verificationStatus"
    >;
};

export type Application = {
    id: string;
    listingId: string;
    studentId: string;
    status: ApplicationStatus;
    coverLetter: string | null;
    resumeUrl: string | null;
    appliedAt: string;
    statusUpdatedAt: string;
    seenAt: string | null;
    screeningAnswers: ScreeningAnswer[];
};

export type SavedListing = {
    userId: string;
    listingId: string;
    createdAt: string;
    listing: ListingWithCompany;
};

export type Asset = {
    id: string;
    userId: string;
    kind: AssetKind;
    bucket: string;
    key: string;
    url: string | null;
    contentType: string | null;
    sizeBytes: number | null;
    createdAt: string;
};

export type Report = {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetListingId: string | null;
    targetStudentId: string | null;
    reason: string;
    status: ReportStatus;
    resolvedById: string | null;
    resolvedAt: string | null;
    resolutionNote: string | null;
    createdAt: string;
};

export type Paginated<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
};
