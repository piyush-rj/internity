import { CompanyRole } from "../db.ts";

// Capability checks for a CompanyMember.role. Encodes the matrix:
//
//   capability            | F_OWNER | CO_FOUNDER | HR | MEMBER | OTHER |
//   ----------------------+---------+------------+----+--------+-------+
//   manage company/team   |   ✓     |     ✓      |    |        |       |
//   post / edit listings  |   ✓     |     ✓      |    |   ✓    |   ✓   |
//   handle applicants     |   ✓     |     ✓      | ✓  |   ✓    |   ✓   |
//
// OTHER mirrors MEMBER (listings + applicants only) — it's a free-text
// label, not a privilege boost. Legacy `OWNER` (pre-migration) is treated
// as `FOUNDER_OWNER` so any row that hasn't been data-migrated still
// behaves correctly.

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
    CompanyRole.OTHER,
]);

const APPLICANT_ROLES: ReadonlySet<CompanyRole> = new Set([
    CompanyRole.FOUNDER_OWNER,
    CompanyRole.CO_FOUNDER,
    CompanyRole.OWNER,
    CompanyRole.HR,
    CompanyRole.MEMBER,
    CompanyRole.OTHER,
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

// Free-text label cap for CompanyMember.customRole / CompanyInvitation.customRole.
// Long enough for compound titles ("Marketing & Growth Lead"), short enough
// to render in the same pill slot as the predefined enum labels.
export const CUSTOM_ROLE_MAX_LENGTH = 60;

// Normalise a (role, customRole) pair coming off the wire. Trims and caps
// the label. Returns customRole = null whenever the role is not OTHER, so
// callers can persist the result directly without leaking stale labels
// when a member is moved out of OTHER.
//
// Throws via the supplied `invalid` callback when role === OTHER but the
// label is missing — surfacing a controller-shaped error keeps the call
// sites terse.
export function normaliseCustomRole(
    role: CompanyRole,
    raw: string | null | undefined,
    invalid: (message: string) => Error,
): string | null {
    if (role !== CompanyRole.OTHER) return null;
    const trimmed = (raw ?? "").trim();
    if (!trimmed) {
        throw invalid("Enter a label for the custom role.");
    }
    return trimmed.length > CUSTOM_ROLE_MAX_LENGTH
        ? trimmed.slice(0, CUSTOM_ROLE_MAX_LENGTH)
        : trimmed;
}
