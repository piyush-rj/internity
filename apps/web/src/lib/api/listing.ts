import { api } from "../apiClient";
import type {
    Application,
    ApplicationStatus,
    Listing,
    ListingType,
    ListingWithCompany,
    Paginated,
    WorkMode,
} from "./types";

export type ListingInput = {
    companyId: string;
    type: ListingType;
    title: string;
    mode: WorkMode;
    city?: string;
    description: string;
    responsibilities?: string[];
    perks?: string[];
    preferences?: string[];
    skillTagsRaw?: string[];
    stipendMin?: number;
    stipendMax?: number;
    durationMonths?: number;
    startDate?: string;
    applyBy?: string;
    openings?: number;
    partTime?: boolean;
};

export type ListingListFilters = {
    type?: ListingType;
    q?: string;
    city?: string;
    mode?: WorkMode;
    skills?: string; // comma-separated
    stipendMin?: number;
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
    list_mine: () =>
        api.get<{ items: (Listing & { _count: { applications: number } })[] }>(
            "/listing/mine",
        ),
    get: (id: string) =>
        api.get<{ listing: ListingWithCompany & { skills: unknown[] } }>(
            `/listing/${id}`,
        ),
    create: (input: ListingInput) =>
        api.post<{ listing: Listing }>("/listing", input),
    update: (id: string, input: Partial<Omit<ListingInput, "companyId">>) =>
        api.patch<{ listing: Listing }>(`/listing/${id}`, input),
    close: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/close`),
    reopen: (id: string) =>
        api.post<{ listing: Listing }>(`/listing/${id}/reopen`),
    remove: (id: string) => api.delete<{ ok: true }>(`/listing/${id}`),

    // apply hangs off /listing/:id/apply
    apply: (listingId: string, input: { coverLetter?: string }) =>
        api.post<{ application: Application }>(
            `/listing/${listingId}/apply`,
            input,
        ),
    // applicants list hangs off /listing/:id/applications
    list_applicants: (listingId: string) =>
        api.get<{ items: unknown[] }>(`/listing/${listingId}/applications`),
};

export const applicationApi = {
    list_mine: () =>
        api.get<{ items: (Application & { listing: ListingWithCompany })[] }>(
            "/application/mine",
        ),
    get: (id: string) =>
        api.get<{ application: unknown }>(`/application/${id}`),
    withdraw: (id: string) => api.delete<{ ok: true }>(`/application/${id}`),
    update_status: (
        id: string,
        status: Exclude<ApplicationStatus, "WITHDRAWN">,
    ) =>
        api.patch<{ application: Application }>(`/application/${id}/status`, {
            status,
        }),
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
    }) => api.post<{ asset: unknown }>("/upload/confirm", input),
    remove: (assetId: string) => api.delete<{ ok: true }>(`/upload/${assetId}`),
};
