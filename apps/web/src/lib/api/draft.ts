import { api } from "../apiClient";

// A saved (not-yet-posted) listing draft. `data` is the post-listing form
// state; it's opaque here and handed straight back to the form when reopened.
export type ListingDraft = {
    id: string;
    title: string;
    companyId: string | null;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};

export const MAX_DRAFTS = 10;

export const draftApi = {
    list: () => api.get<{ items: ListingDraft[] }>("/draft"),
    get: (id: string) => api.get<{ draft: ListingDraft }>(`/draft/${id}`),
    create: (input: {
        title?: string;
        companyId?: string | null;
        data: Record<string, unknown>;
    }) => api.post<{ draft: ListingDraft }>("/draft", input),
    update: (
        id: string,
        input: { title?: string; data?: Record<string, unknown> },
    ) => api.patch<{ draft: ListingDraft }>(`/draft/${id}`, input),
    remove: (id: string) => api.delete<{ ok: true }>(`/draft/${id}`),
};
