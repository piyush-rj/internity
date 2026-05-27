import { CompanyRole } from "../db.ts";

// Capability checks for a CompanyMember.role. Encodes the matrix:
//
//   capability            | F_OWNER | CO_FOUNDER | HR | MEMBER |
//   ----------------------+---------+------------+----+--------+
//   manage company/team   |   ✓     |     ✓      |    |        |
//   post / edit listings  |   ✓     |     ✓      |    |   ✓    |
//   handle applicants     |   ✓     |     ✓      | ✓  |   ✓    |
//
// Legacy `OWNER` (pre-migration) is treated as `FOUNDER_OWNER` everywhere
// so any row that hasn't been data-migrated still behaves correctly.

const ADMIN_ROLES: ReadonlySet<CompanyRole> = new Set([
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
]);

const LISTING_ROLES: ReadonlySet<CompanyRole> = new Set([
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
    CompanyRole.MEMBER,
]);

const APPLICANT_ROLES: ReadonlySet<CompanyRole> = new Set([
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
    CompanyRole.HR,
    CompanyRole.MEMBER,
]);

// True iff the role can edit the company profile, invite/remove members,
// or change other members' roles. (Founder-level seats only.)
export function canManageCompany(role: CompanyRole): boolean {
    return ADMIN_ROLES.has(role);
}

// True iff the role can create/edit/close listings.
export function canManageListings(role: CompanyRole): boolean {
    return LISTING_ROLES.has(role);
}

// True iff the role can act on applicants — read the list, change status,
// message, and schedule interviews.
export function canManageApplicants(role: CompanyRole): boolean {
    return APPLICANT_ROLES.has(role);
}

// True iff the role behaves as a "founder" for retention checks (e.g. the
// sole-founder block on account deletion or last-owner removal). Same set
// as canManageCompany today but kept separate for intent clarity.
export function isFounderRole(role: CompanyRole): boolean {
    return ADMIN_ROLES.has(role);
}

// Normalises a legacy OWNER role label down to FOUNDER_OWNER when echoing
// back to a client (any historical row written before the migration).
export function normalizeRole(role: CompanyRole): CompanyRole {
    return role === CompanyRole.OWNER ? CompanyRole.FOUNDER_OWNER : role;
}
