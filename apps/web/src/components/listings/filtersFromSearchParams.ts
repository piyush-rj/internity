import type {
    JobTitle,
    ListingListFilters,
    WorkMode,
} from "@/src/lib/api";

const JOB_TITLES_LIST = [
    "AI",
    "BACKEND",
    "WEB",
    "MOBILE",
    "QA",
    "DESIGN",
    "PRODUCT",
    "MARKETING",
    "CONTENT",
    "SALES",
    "DATA",
    "HR",
    "CUSTOM",
] as const;

export const PAGE_SIZE = 20;

// parses url search params into a listing filters object
export function filtersFromSearchParams(
    sp: URLSearchParams | null,
): ListingListFilters {
    const filters: ListingListFilters = {
        pageSize: PAGE_SIZE,
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

    const jobTitle = sp.get("jobTitle");
    if (jobTitle && (JOB_TITLES_LIST as readonly string[]).includes(jobTitle)) {
        filters.jobTitle = jobTitle as JobTitle;
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
