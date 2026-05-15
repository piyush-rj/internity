import { api } from "../apiClient";
import type {
    Company,
    CompanyMember,
    CompanyRole,
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
    about?: string;
    industry?: string;
    size?: string;
    city?: string;
};

export type CompanyMemberWithUser = CompanyMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
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
    update: (id: string, input: Partial<Omit<CompanyInput, "slug">>) =>
        api.patch<{ company: Company }>(`/company/${id}`, input),

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
