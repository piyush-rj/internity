import type { ListingListFilters, ListingType, WorkMode } from "@/src/lib/api";

export const PAGE_SIZE = 20;

/**
 * Parse the URL search params into a `ListingListFilters` object the
 * backend understands. Empty / invalid values are dropped so the request
 * URL stays clean.
 */
export function filtersFromSearchParams(
    sp: URLSearchParams | null,
    overrides: { type?: ListingType } = {},
): ListingListFilters {
    const filters: ListingListFilters = {
        pageSize: PAGE_SIZE,
        ...overrides,
    };
    if (!sp) return filters;

    const q = sp.get("q")?.trim();
    if (q) filters.q = q;

    const city = sp.get("city")?.trim();
    if (city) filters.city = city;

    const mode = sp.get("mode");
    if (mode === "REMOTE" || mode === "HYBRID" || mode === "ONSITE") {
        filters.mode = mode as WorkMode;
    }

    const skills = sp.get("skills")?.trim();
    if (skills) filters.skills = skills;

    const stipendMin = sp.get("stipendMin");
    if (stipendMin && Number.isFinite(Number(stipendMin))) {
        filters.stipendMin = Number(stipendMin);
    }

    const durationMax = sp.get("durationMax");
    if (durationMax && Number.isFinite(Number(durationMax))) {
        filters.durationMax = Number(durationMax);
    }

    if (sp.get("partTime") === "true") filters.partTime = "true";

    const page = Number(sp.get("page"));
    if (Number.isFinite(page) && page > 1) filters.page = page;

    return filters;
}
