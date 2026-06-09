import type { ListingListFilters, WorkMode } from "@/src/lib/api";

const JOB_TITLES_LIST = [
    "AI",
    "BACKEND",
    "WEB",
    "MOBILE",
    "QA",
    "DESIGN",
    "PRODUCT",
    "RESEARCHER",
    "MARKETING",
    "CONTENT",
    "VIDEO",
    "SALES",
    "SOCIAL",
    "DATA",
    "HR",
    "CUSTOM",
] as const;

export const PAGE_SIZE = 10;

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

    // Multi-select job titles (comma-separated). Falls back to the legacy
    // single `jobTitle` param for old URLs. Server matches ANY of them.
    const jobTitlesRaw = sp.get("jobTitles") ?? sp.get("jobTitle") ?? "";
    const jobTitles = jobTitlesRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => (JOB_TITLES_LIST as readonly string[]).includes(s));
    if (jobTitles.length > 0) filters.jobTitles = jobTitles.join(",");

    const customRole = sp.get("customRole")?.trim();
    if (customRole) filters.customRole = customRole;

    const skills = sp.get("skills")?.trim();
    if (skills) filters.skills = skills;

    const minSalary = sp.get("minSalary");
    if (minSalary && Number.isFinite(Number(minSalary))) {
        filters.minSalary = Number(minSalary);
    }

    const currency = sp.get("currency")?.trim();
    if (currency) filters.currency = currency;

    const durationMax = sp.get("durationMax");
    if (durationMax && Number.isFinite(Number(durationMax))) {
        filters.durationMax = Number(durationMax);
    }

    if (sp.get("partTime") === "true") filters.partTime = "true";

    const page = Number(sp.get("page"));
    if (Number.isFinite(page) && page > 1) filters.page = page;

    return filters;
}
