import { api } from "../apiClient";
import type {
    ApplicationStatus,
    Company,
    CompanyMember,
    CompanyRole,
    CompanyVerificationStatus,
    EmployerProfile,
    Listing,
    OrganizationType,
    User,
} from "./types";

export type EmployerProfileInput = {
    firstName: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    linkedinUrl?: string;
    country?: string;
};

export type CompanyInput = {
    name: string;
    slug: string;
    logoUrl?: string;
    website?: string;
    linkedinUrl?: string;
    foundingYear: number;
    about: string;
    industry?: string;
    size: string;
    city?: string;
    country: string;
    organizationType: OrganizationType;
};

export type CompanyUpdateInput = Partial<
    Omit<CompanyInput, "slug" | "foundingYear" | "about" | "size">
> & {
    foundingYear?: number;
    about?: string;
    size?: string;
};

export type CompanyMemberWithUser = CompanyMember & {
    user: Pick<User, "id" | "name" | "email" | "image"> & {
        deletedAt: string | null;
    };
};

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
        isBanned: boolean;
        banReason: string | null;
        bannedAt: string | null;
        employerProfile: {
            firstName: string;
            lastName: string | null;
            phone: string | null;
            jobTitle: string | null;
            linkedinUrl: string | null;
        } | null;
    };
};

export type AdminCompanyListingSnapshot = {
    id: string;
    title: string;
    jobTitle: string | null;
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

export type AdminFounderListItem = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    jobTitle: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        createdAt: string;
        isBanned: boolean;
        companyMemberships: Array<{
            companyId: string;
            userId: string;
            role: CompanyRole;
            joinedAt: string;
            company: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
                verificationStatus: CompanyVerificationStatus;
            };
        }>;
    };
};

export const employerApi = {
    get_me: () =>
        api.get<{
            profile: EmployerProfile | null;
            memberships: (CompanyMember & { company: Company })[];
            listingQuota: { remaining: number | null; total: number | null } | null;
        }>("/employer/me"),
    create: (input: EmployerProfileInput) =>
        api.post<{ profile: EmployerProfile }>("/employer/me", input),
    update: (input: Partial<EmployerProfileInput>) =>
        api.patch<{ profile: EmployerProfile }>("/employer/me", input),

    admin_list: (params: { q?: string; page?: number; pageSize?: number }) =>
        api.get<{
            items: AdminFounderListItem[];
            page: number;
            pageSize: number;
            total: number;
        }>("/employer/admin/list", params),
};

export type CompanyInvitation = {
    id: string;
    companyId: string;
    email: string;
    role: CompanyRole;
    customRole: string | null;
    token: string;
    invitedById: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    acceptedById: string | null;
    invitedBy?: { id: string; name: string | null; email: string | null };
};

export type InvitationLookup = {
    invitation: CompanyInvitation & {
        company: {
            id: string;
            name: string;
            slug: string;
            logoUrl: string | null;
            verificationStatus: CompanyVerificationStatus;
        };
        invitedBy: { id: string; name: string | null; email: string | null };
    };
    state: "pending" | "accepted" | "expired";
};

export type CompanyDashboard = {
    companyId: string;
    funnel: Record<
        | "APPLIED"
        | "SHORTLISTED"
        | "INTERVIEW"
        | "HIRED"
        | "REJECTED"
        | "WITHDRAWN",
        number
    > & { total: number };
    listings: {
        active: number;
        paused: number;
        closed: number;
        expired: number;
        takenDown: number;
        total: number;
    };
    recentApplicants: Array<{
        id: string;
        status: ApplicationStatus;
        appliedAt: string;
        seenAt: string | null;
        student: { id: string; name: string | null; image: string | null };
        listing: { id: string; title: string };
    }>;
    interviews: { upcoming: number };
    team: {
        count: number;
        members: Array<{
            userId: string;
            name: string | null;
            image: string | null;
            role: CompanyRole;
            customRole: string | null;
        }>;
    };
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

    dashboard: (id: string) =>
        api.get<{ dashboard: CompanyDashboard }>(`/company/${id}/dashboard`),

    list_members: (id: string) =>
        api.get<{ members: CompanyMemberWithUser[] }>(`/company/${id}/members`),
    add_member: (
        id: string,
        input: {
            email: string;
            role?: CompanyRole;
            customRole?: string | null;
        },
    ) => api.post<{ member: CompanyMember }>(`/company/${id}/members`, input),
    update_member_role: (
        id: string,
        userId: string,
        role: CompanyRole,
        customRole?: string | null,
    ) =>
        api.patch<{ member: CompanyMember }>(
            `/company/${id}/members/${userId}`,
            { role, customRole },
        ),
    remove_member: (id: string, userId: string) =>
        api.delete<{ ok: true }>(`/company/${id}/members/${userId}`),

    list_invitations: (id: string) =>
        api.get<{ invitations: CompanyInvitation[] }>(`/company/${id}/invites`),
    create_invitation: (
        id: string,
        input: {
            email: string;
            role?: CompanyRole;
            customRole?: string | null;
        },
    ) =>
        api.post<{ invitation: CompanyInvitation }>(
            `/company/${id}/invites`,
            input,
        ),
    revoke_invitation: (id: string, inviteId: string) =>
        api.delete<{ ok: true }>(`/company/${id}/invites/${inviteId}`),
};

export const invitationApi = {
    get: (token: string) => api.get<InvitationLookup>(`/invitation/${token}`),
    accept: (token: string) =>
        api.post<{ member: CompanyMember }>(`/invitation/${token}/accept`),
};
