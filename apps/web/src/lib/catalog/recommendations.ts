import type { JobTitle } from "@/src/lib/api";

// Per-role recommendation map: for a role a student is interested in, the
// related roles whose listings we surface as "recommended". Each list leads
// with the role itself, then adjacent roles, mirroring the product spec table.
export const RECOMMENDED_BY_JOB_TITLE: Record<JobTitle, JobTitle[]> = {
    AI: ["AI", "BACKEND", "PRODUCT", "RESEARCHER", "DATA"],
    BACKEND: ["BACKEND", "AI", "WEB", "MOBILE", "QA", "DATA"],
    WEB: ["WEB", "BACKEND", "MOBILE", "DESIGN", "QA", "PRODUCT"],
    MOBILE: ["MOBILE", "WEB", "BACKEND", "DESIGN", "QA", "PRODUCT"],
    DESIGN: ["DESIGN", "PRODUCT", "RESEARCHER", "WEB", "MOBILE", "MARKETING"],
    QA: ["QA", "BACKEND", "WEB", "MOBILE", "PRODUCT", "DATA"],
    PRODUCT: ["PRODUCT", "RESEARCHER", "MARKETING", "DATA", "DESIGN", "SALES"],
    RESEARCHER: [
        "RESEARCHER",
        "PRODUCT",
        "DATA",
        "DESIGN",
        "MARKETING",
        "CONTENT",
    ],
    MARKETING: [
        "MARKETING",
        "SOCIAL",
        "CONTENT",
        "PRODUCT",
        "RESEARCHER",
        "SALES",
    ],
    CONTENT: ["CONTENT", "MARKETING", "SOCIAL", "RESEARCHER", "VIDEO"],
    VIDEO: ["VIDEO", "CONTENT", "SOCIAL", "MARKETING", "DESIGN"],
    SALES: ["SALES", "MARKETING", "PRODUCT", "SOCIAL", "HR"],
    SOCIAL: ["SOCIAL", "MARKETING", "CONTENT", "VIDEO", "RESEARCHER"],
    DATA: ["DATA", "AI", "RESEARCHER", "PRODUCT", "BACKEND", "MARKETING"],
    HR: ["HR", "SALES", "MARKETING", "PRODUCT"],
    CUSTOM: ["CUSTOM", "PRODUCT", "RESEARCHER", "MARKETING", "DATA"],
};

// Expand a student's interested roles into a de-duplicated, priority-ordered
// list of recommended roles. Interested roles (and their top matches) come
// first. Returns [] when the student picked no roles — callers fall back to a
// generic recent-listings view in that case.
export function recommendedJobTitles(interested: JobTitle[]): JobTitle[] {
    const out: JobTitle[] = [];
    const seen = new Set<JobTitle>();
    for (const role of interested) {
        for (const rec of RECOMMENDED_BY_JOB_TITLE[role] ?? []) {
            if (!seen.has(rec)) {
                seen.add(rec);
                out.push(rec);
            }
        }
    }
    return out;
}
