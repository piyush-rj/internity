-- Add an OTHER seat to CompanyRole plus a free-text `customRole` label
-- on CompanyMember + CompanyInvitation. The label is populated only when
-- role = OTHER; for predefined roles the column stays null and display
-- layers use the enum-label catalogue.
--
-- Capability-wise OTHER mirrors MEMBER (post listings only); see
-- apps/server/src/utils/company-roles.ts.

ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'OTHER';

-- Postgres requires the new enum value to be committed before it can be
-- referenced. No row updates are needed here, but the pattern follows
-- earlier migrations in this directory.
COMMIT;
BEGIN;

ALTER TABLE "CompanyMember"
    ADD COLUMN "customRole" TEXT;

ALTER TABLE "CompanyInvitation"
    ADD COLUMN "customRole" TEXT;
