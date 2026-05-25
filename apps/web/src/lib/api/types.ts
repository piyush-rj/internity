// Shared shapes — keep these in sync with the Prisma schema.

export type UserRole = "STUDENT" | "EMPLOYER" | "ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type ListingType = "INTERNSHIP" | "JOB";
export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";
export type ApplicationStatus =
    | "APPLIED"
    | "SHORTLISTED"
    | "INTERVIEW"
    | "HIRED"
    | "REJECTED"
    | "WITHDRAWN";
export type CompanyRole = "OWNER" | "MEMBER";
export type CompanyVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AssetKind = "RESUME" | "COMPANY_LOGO" | "PROFILE_IMAGE";

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
    educations: Education[];
    experiences: WorkExperience[];
    projects: Project[];
    skills: StudentSkill[];
    certifications: Certification[];
    languages: Language[];
};

export type EmployerProfile = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    jobTitle: string | null;
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
    foundingYear: number | null;
    verificationStatus: CompanyVerificationStatus;
    rejectionNote: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
};

export type CompanyMember = {
    companyId: string;
    userId: string;
    role: CompanyRole;
    joinedAt: string;
};

export type Listing = {
    id: string;
    companyId: string;
    postedById: string;
    type: ListingType;
    title: string;
    mode: WorkMode;
    city: string | null;
    description: string;
    responsibilities: string[];
    perks: string[];
    preferences: string[];
    skillTagsRaw: string[];
    stipendMin: number | null;
    stipendMax: number | null;
    currency: string | null;
    durationMonths: number | null;
    startDate: string | null;
    applyBy: string | null;
    openings: number | null;
    partTime: boolean;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
};

export type ListingWithCompany = Listing & {
    company: Pick<Company, "id" | "name" | "slug" | "logoUrl">;
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

export type Paginated<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
};
