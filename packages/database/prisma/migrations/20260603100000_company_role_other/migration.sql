-- Add an OTHER seat to CompanyRole plus a free-text `customRole` label
-- on CompanyMember + CompanyInvitation. The label is populated only when
-- role = OTHER; for predefined roles the column stays null and display
-- layers use the enum-label catalogue.
--
-- Capability-wise OTHER mirrors MEMBER (post listings only); see
-- apps/server/src/utils/company-roles.ts.
--
-- Idempotent: `ADD VALUE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
-- so re-running after a partial failure is safe.

ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "CompanyMember"
    ADD COLUMN IF NOT EXISTS "customRole" TEXT;

ALTER TABLE "CompanyInvitation"
    ADD COLUMN IF NOT EXISTS "customRole" TEXT;
