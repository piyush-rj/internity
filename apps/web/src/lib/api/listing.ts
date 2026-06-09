import { api } from "../apiClient";
import type {
    Application,
    ApplicationStatus,
    CompanyVerificationStatus,
    JobTitle,
    Listing,
    ListingWithCompany,
    Paginated,
    Report,
    ReportStatus,
    ReportTargetType,
    Resume,
    ScreeningAnswer,
    ScreeningQuestion,
    StudentProfile,
    User,
    WorkMode,
} from "./types";

export type ApplicantStudentEducation = {
    institute: string;
    degree: string;
    fieldOfStudy: string | null;
    startYear: number;
    endYear: number | null;
    current: boolean;
};

export type ApplicantStudentProject = {
    id: string;
    title: string;
    link: string | null;
};

export type ApplicantStudentExperience = {
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string | null;
    current: boolean;
};

export type ApplicantWithStudent = Application & {
    student: Pick<User, "id" | "name" | "email" | "image"> & {
        deletedAt: string | null;
        studentProfile:
            | (Pick<
                  StudentProfile,
                  | "firstName"
                  | "lastName"
                  | "phone"
                  | "city"
                  | "bio"
                  | "isVerified"
              > & {
                  skills: Array<{ skill: { name: string } }>;
                  educations: ApplicantStudentEducation[];
                  projects: ApplicantStudentProject[];
                  experiences: ApplicantStudentExperience[];
              })
            | null;
    };
};

export type AdminListingListItem = Listing & {
    company: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        verificationStatus: CompanyVerificationStatus;
    };
    postedBy: Pick<User, "id" | "name" | "email" | "image">;
    _count: { applications: number };
};

export type AdminListingStateFilter = "live" | "closed" | "takendown" | "all";

export type ListingInput = {
    companyId: string;
    title: string;
    jobTitle?: JobTitle | null;
    customJobTitle?: string | null;
    mode: WorkMode;
    city?: string;
    description: string;
    responsibilities?: string[];
    perks?: string[];
    preferences?: string[];
    skillTagsRaw?: string[];
    screeningQuestions?: ScreeningQuestion[];
    currency?: string;
    // Compulsory on create. Pass 0 explicitly for unpaid roles.
    stipendMin: number;
    stipendMax?: number;
    durationMonths?: number;
    durationWeeks?: number;
    startDate?: string | null;
    startDateLatest?: string | null;
    applyBy?: string;
    openings?: number;
    partTime?: boolean;
    ppo?: boolean;
};

export type ListingListFilters = {
    q?: string;
    city?: string;
    mode?: WorkMode;
    jobTitle?: JobTitle;
    // Comma-separated job titles (e.g. recommended roles); matches any of them.
    jobTitles?: string;
    // Free-text custom role; OR-combined with jobTitles, matched against the
    // listing title + custom job-title.
    customRole?: string;
    skills?: string;
    minSalary?: number;
    currency?: string;
    durationMax?: number;
    partTime?: "true" | "false";
    page?: number;
    pageSize?: number;
};

export const listingApi = {
    list: (filters?: ListingListFilters) =>
        api.get<Paginated<ListingWithCompany>>(
            "/listing",
            filters as Record<string, unknown>,
        ),
    list_mine: (params?: { scope?: "mine" | "company"; companyId?: string }) =>
        api.get<{
            items: (Listing & {
                _count: {
                    applications: number;
                    applicationsSeen: number;
                };
            })[];
        }>("/listing/mine", params as Record<string, unknown>),
    get: (id: string) =>
        api.get<{
            listing: ListingWithCompany & {
                skills: unknown[];
                postedBy: {
                    id: string;
                    name: string | null;
                    image: string | null;
                    employerProfile: {
                        firstName: string;
                        lastName: string | null;
                        jobTitle: string | null;
                        linkedinUrl: string | null;
                    } | null;
                };
            };
        }>(`/listing/${id}`),
    create: (input: ListingInput) =>
        api.post<{ listing: Listing }>("/listing", input),
    update: (id: string, input: Partial<Omit<ListingInput, "companyId">>) =>
        api.patch<{ listing: Listing }>(`/listing/${id}`, input),
    close: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/close`),
    reopen: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/reopen`),
    renew: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/renew`),
    pause: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/pause`),
    unpause: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/unpause`),
    remove: (id: string) => api.delete<{ ok: true }>(`/listing/${id}`),

    apply: (
        listingId: string,
        input: {
            coverLetter?: string;
            screeningAnswers?: ScreeningAnswer[];
            resumeUrl?: string | null;
        },
    ) =>
        api.post<{ application: Application }>(
            `/listing/${listingId}/apply`,
            input,
        ),
    list_applicants: (listingId: string) =>
        api.get<{
            items: ApplicantWithStudent[];
            screeningQuestions: ScreeningQuestion[];
            skillTagsRaw: string[];
        }>(`/listing/${listingId}/applications`),

    admin_list: (params: {
        state?: AdminListingStateFilter;
        q?: string;
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: AdminListingListItem[];
            page: number;
            pageSize: number;
            total: number;
        }>("/listing/admin/list", params),
    admin_take_down: (id: string, reason: string) =>
        api.post<{ listing: Listing }>(`/listing/admin/${id}/take-down`, {
            reason,
        }),
    admin_restore: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/admin/${id}/restore`),
};

export type ApplyBatchSkipReason =
    | "ALREADY_APPLIED"
    | "OWN_COMPANY"
    | "CLOSED"
    | "PAUSED"
    | "EXPIRED"
    | "TAKEN_DOWN"
    | "SCREENING_REQUIRED"
    | "NOT_FOUND";

export type ApplyBatchResult = {
    created: number;
    skipped: Array<{ listingId: string; reason: ApplyBatchSkipReason }>;
};

export const applicationApi = {
    list_mine: () =>
        api.get<{ items: (Application & { listing: ListingWithCompany })[] }>(
            "/application/mine",
        ),
    get: (id: string) =>
        api.get<{ application: unknown }>(`/application/${id}`),
    withdraw: (id: string) => api.delete<{ ok: true }>(`/application/${id}`),
    restore: (id: string) =>
        api.post<{ application: Application }>(`/application/${id}/restore`),
    update_status: (
        id: string,
        status: Exclude<ApplicationStatus, "WITHDRAWN">,
    ) =>
        api.patch<{ application: Application }>(`/application/${id}/status`, {
            status,
        }),
    apply_batch: (input: { listingIds: string[]; coverLetter?: string }) =>
        api.post<ApplyBatchResult>("/application/batch", input),
};

export const savedApi = {
    list: () =>
        api.get<{
            items: {
                listingId: string;
                createdAt: string;
                listing: ListingWithCompany;
            }[];
        }>("/saved"),
    save: (listingId: string) =>
        api.post<{ saved: unknown }>(`/saved/${listingId}`),
    unsave: (listingId: string) =>
        api.delete<{ ok: true }>(`/saved/${listingId}`),
};

export const skillApi = {
    autocomplete: (q: string) =>
        api.get<{ items: { id: string; name: string }[] }>("/skill", { q }),
};

export const uploadApi = {
    sign: (input: {
        kind: "RESUME" | "COMPANY_LOGO" | "PROFILE_IMAGE";
        contentType: string;
        sizeBytes: number;
    }) =>
        api.post<{ key: string; putUrl: string; getUrl: string }>(
            "/upload/sign",
            input,
        ),
    confirm: (input: {
        kind: "RESUME" | "COMPANY_LOGO" | "PROFILE_IMAGE";
        key: string;
        contentType: string;
        sizeBytes: number;
        companyId?: string;
        fileName?: string;
    }) => api.post<{ asset: unknown }>("/upload/confirm", input),
    remove: (assetId: string) => api.delete<{ ok: true }>(`/upload/${assetId}`),
};

export const resumeApi = {
    list: () => api.get<{ items: Resume[] }>("/resume"),
    setDefault: (id: string) => api.post<{ ok: true }>(`/resume/${id}/default`),
    remove: (id: string) => api.delete<{ ok: true }>(`/resume/${id}`),
};

export const reportApi = {
    create: (input: {
        targetType: ReportTargetType;
        targetListingId?: string | null;
        targetStudentId?: string | null;
        reason: string;
    }) => api.post<{ report: Report }>("/report", input),
    admin_list: (params: {
        status?: ReportStatus;
        targetType?: ReportTargetType;
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: Array<
                Report & {
                    reporter: Pick<User, "id" | "name" | "email">;
                    targetListing: {
                        id: string;
                        title: string;
                        company: {
                            id: string;
                            name: string;
                            slug: string;
                        };
                    } | null;
                    targetStudent:
                        | (Pick<User, "id" | "name" | "email"> & {
                              isBanned: boolean;
                          })
                        | null;
                    resolvedBy: Pick<User, "id" | "name" | "email"> | null;
                }
            >;
            page: number;
            pageSize: number;
            total: number;
        }>("/report/admin", params as Record<string, unknown>),
    admin_resolve: (
        id: string,
        input: { status: "RESOLVED" | "DISMISSED"; note?: string },
    ) => api.post<{ report: Report }>(`/report/admin/${id}/resolve`, input),
};

export const accountApi = {
    switchCompany: (companyId: string | null) =>
        api.post<{ activeCompanyId: string | null }>("/auth/switch-company", {
            companyId,
        }),
    deleteAccount: () => api.delete<{ ok: true }>("/auth/me"),
};
