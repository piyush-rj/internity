import type { JobTitle } from "@/src/lib/api";

export const JOB_TITLES: ReadonlyArray<{
    value: Exclude<JobTitle, "CUSTOM">;
    label: string;
}> = [
    { value: "AI", label: "AI Developer Internship" },
    { value: "BACKEND", label: "Backend Developer Internship" },
    { value: "WEB", label: "Web App Developer Internship" },
    { value: "MOBILE", label: "Mobile App Developer Internship" },
    { value: "DESIGN", label: "UI/UX Designer Internship" },
    { value: "QA", label: "QA Engineer Internship" },
    { value: "PRODUCT", label: "Product Manager Internship" },
    { value: "RESEARCHER", label: "Product Researcher Internship" },
    { value: "MARKETING", label: "Marketing Specialist Internship" },
    { value: "CONTENT", label: "Content Writer Internship" },
    { value: "VIDEO", label: "Video Editor Internship" },
    { value: "SALES", label: "Sales / Business Development Internship" },
    { value: "SOCIAL", label: "Social Media Manager Internship" },
    { value: "DATA", label: "Data Analyst Internship" },
    { value: "HR", label: "Human Resources Internship" },
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
