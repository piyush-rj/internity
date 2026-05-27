import type { OrganizationType } from "@/src/lib/api";

export const ORG_TYPES: ReadonlyArray<{
    value: OrganizationType;
    label: string;
}> = [
    { value: "SOLO_FOUNDER", label: "Solo Founder" },
    { value: "STARTUP_TEAM", label: "Startup Team" },
    { value: "BOOTSTRAPPED_STARTUP", label: "Bootstrapped Startup" },
    { value: "PRIVATE_LIMITED", label: "Private Limited Company (Pvt Ltd)" },
    { value: "LLP", label: "LLP" },
    { value: "AGENCY", label: "Agency / Service Company" },
    { value: "FREELANCER", label: "Freelancer / Independent Recruiter" },
    { value: "STUDENT_STARTUP", label: "Student Startup" },
    { value: "OTHER", label: "Other" },
];

export function organizationTypeLabel(
    value: OrganizationType | null | undefined,
): string {
    if (!value) return "";
    return ORG_TYPES.find((o) => o.value === value)?.label ?? "Other";
}
