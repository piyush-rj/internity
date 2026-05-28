import type { CompanyRole } from "@/src/lib/api";

// Single source of truth for company-role copy and pill styling. The
// `OWNER` enum value is the legacy label kept for back-compat — it should
// not appear in dropdowns, but if a stale row arrives it still renders.

export const COMPANY_ROLE_LABEL: Record<CompanyRole, string> = {
    FOUNDER_OWNER: "Founder",
    CO_FOUNDER: "Co-founder",
    HR: "HR",
    MEMBER: "Member",
    OWNER: "Founder",
};

// Short one-line description shown next to the role in dropdowns / pickers.
// Lets a founder explain the permission boundary without a tooltip.
export const COMPANY_ROLE_HINT: Record<CompanyRole, string> = {
    FOUNDER_OWNER: "Full admin: team, listings, applicants",
    CO_FOUNDER: "Full admin: team, listings, applicants",
    HR: "Manages applicants & interviews",
    MEMBER: "Posts listings only",
    OWNER: "Full admin: team, listings, applicants",
};

export const COMPANY_ROLE_BADGE_STYLE: Record<CompanyRole, string> = {
    FOUNDER_OWNER: "bg-brand/10 text-brand border-brand/20",
    CO_FOUNDER: "bg-violet-50 text-violet-700 border-violet-200",
    HR: "bg-sky-50 text-sky-700 border-sky-200",
    MEMBER: "bg-secondary text-foreground border-border",
    OWNER: "bg-brand/10 text-brand border-brand/20",
};

// Roles surfaced in selectable inputs (invite + change-role pickers). OWNER
// is intentionally omitted; promoting someone always picks FOUNDER_OWNER.
export const SELECTABLE_COMPANY_ROLES: ReadonlyArray<
    Exclude<CompanyRole, "OWNER">
> = ["FOUNDER_OWNER", "CO_FOUNDER", "HR", "MEMBER"];

// Helper: capability checks mirroring the server-side helpers in
// apps/server/src/utils/company-roles.ts. Keep these two files in sync.

export function canManageCompany(role: CompanyRole): boolean {
    return (
        role === "FOUNDER_OWNER" || role === "CO_FOUNDER" || role === "OWNER"
    );
}

export function canManageListings(role: CompanyRole): boolean {
    return canManageCompany(role) || role === "MEMBER";
}

export function canManageApplicants(role: CompanyRole): boolean {
    return canManageCompany(role) || role === "HR" || role === "MEMBER";
}
