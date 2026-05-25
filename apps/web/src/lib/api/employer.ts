import { api } from "../apiClient";
import type {
    Company,
    CompanyMember,
    CompanyRole,
    CompanyVerificationStatus,
    EmployerProfile,
    Listing,
    User,
} from "./types";

export type EmployerProfileInput = {
    firstName: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
};

export type CompanyInput = {
    name: string;
    slug: string;
    logoUrl?: string;
    website?: string;
    linkedinUrl: string;
    foundingYear: number;
    about: string;
    industry?: string;
    size: string;
    city?: string;
};

export type CompanyUpdateInput = Partial<
    Omit<CompanyInput, "slug" | "linkedinUrl" | "foundingYear" | "about" | "size">
> & {
    linkedinUrl?: string;
    foundingYear?: number;
    about?: string;
    size?: string;
};

export type CompanyMemberWithUser = CompanyMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
};

/* ---------------------------- Admin shapes -------------------------------- */

export type AdminCompanyListItem = Company & {
    _count: { members: number; listings: number };
    members: Array<{
        companyId: string;
        userId: string;
        role: CompanyRole;
        joinedAt: string;
        user: Pick<User, "id" | "name" | "email" | "image">;
    }>;
};

export type AdminCompanyDetailMember = {
    companyId: string;
    userId: string;
    role: CompanyRole;
    joinedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        createdAt: string;
        employerProfile: {
            firstName: string;
            lastName: string | null;
            phone: string | null;
            jobTitle: string | null;
        } | null;
    };
};

export type AdminCompanyListingSnapshot = {
    id: string;
    title: string;
    type: "INTERNSHIP" | "JOB";
    mode: "REMOTE" | "HYBRID" | "ONSITE";
    city: string | null;
    applyBy: string | null;
    closedAt: string | null;
    createdAt: string;
    _count: { applications: number };
};

export type AdminCompanyDetail = Company & {
    members: AdminCompanyDetailMember[];
    listings: AdminCompanyListingSnapshot[];
    _count: { listings: number };
};

export const employerApi = {
    get_me: () =>
        api.get<{
            profile: EmployerProfile | null;
            memberships: (CompanyMember & { company: Company })[];
        }>("/employer/me"),
    create: (input: EmployerProfileInput) =>
        api.post<{ profile: EmployerProfile }>("/employer/me", input),
    update: (input: Partial<EmployerProfileInput>) =>
        api.patch<{ profile: EmployerProfile }>("/employer/me", input),
};

export const companyApi = {
    create: (input: CompanyInput) =>
        api.post<{ company: Company & { members: CompanyMember[] } }>(
            "/company",
            input,
        ),
    get_by_slug: (slug: string) =>
        api.get<{ company: Company & { listings: Listing[] } }>(
            `/company/${slug}`,
        ),
    update: (id: string, input: CompanyUpdateInput) =>
        api.patch<{ company: Company }>(`/company/${id}`, input),
    set_verification: (
        id: string,
        input: {
            status: Exclude<CompanyVerificationStatus, "PENDING">;
            rejectionNote?: string;
        },
    ) => api.post<{ company: Company }>(`/company/${id}/verification`, input),

    admin_list: (params: {
        status?: CompanyVerificationStatus;
        q?: string;
        page?: number;
        pageSize?: number;
    }) =>
        api.get<{
            items: AdminCompanyListItem[];
            page: number;
            pageSize: number;
            total: number;
        }>("/company/admin/list", params),
    admin_get: (id: string) =>
        api.get<{ company: AdminCompanyDetail }>(`/company/admin/${id}`),

    list_members: (id: string) =>
        api.get<{ members: CompanyMemberWithUser[] }>(`/company/${id}/members`),
    add_member: (id: string, input: { email: string; role?: CompanyRole }) =>
        api.post<{ member: CompanyMember }>(`/company/${id}/members`, input),
    update_member_role: (id: string, userId: string, role: CompanyRole) =>
        api.patch<{ member: CompanyMember }>(
            `/company/${id}/members/${userId}`,
            {
                role,
            },
        ),
    remove_member: (id: string, userId: string) =>
        api.delete<{ ok: true }>(`/company/${id}/members/${userId}`),
};
