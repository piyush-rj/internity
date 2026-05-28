import type { JobTitle } from "@/src/lib/api";

// Single source of truth for the predefined job-title list shown in the
// post-listing dropdown and (mirrored) in the student-side filter. CUSTOM
// is the only branch that surfaces a free-text input next to the picker.
export const JOB_TITLES: ReadonlyArray<{
    value: Exclude<JobTitle, "CUSTOM">;
    label: string;
}> = [
    { value: "AI", label: "AI / ML Engineer" },
    { value: "BACKEND", label: "Backend Developer" },
    { value: "WEB", label: "Web Developer" },
    { value: "MOBILE", label: "Mobile Developer" },
    { value: "QA", label: "QA / Testing" },
    { value: "DESIGN", label: "Design (UI / UX / Graphic)" },
    { value: "PRODUCT", label: "Product Manager" },
    { value: "MARKETING", label: "Marketing" },
    { value: "CONTENT", label: "Content / Writing" },
    { value: "SALES", label: "Sales / BD" },
    { value: "DATA", label: "Data Analyst / Scientist" },
    { value: "HR", label: "HR / People Ops" },
];

const LABEL_BY_VALUE: Record<JobTitle, string> = {
    ...Object.fromEntries(JOB_TITLES.map((t) => [t.value, t.label])),
    CUSTOM: "Other",
} as Record<JobTitle, string>;

export function jobTitleLabel(
    jobTitle: JobTitle | null | undefined,
    customJobTitle?: string | null,
    fallbackTitle?: string | null,
): string {
    if (!jobTitle) return fallbackTitle ?? "Untitled role";
    if (jobTitle === "CUSTOM") {
        return customJobTitle?.trim() || fallbackTitle?.trim() || "Other";
    }
    return LABEL_BY_VALUE[jobTitle];
}
