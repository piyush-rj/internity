-- Migrate legacy OWNER rows to FOUNDER_OWNER and add the small set of new
-- columns powering the post-listing + student profile + apply form refresh:
--   * Listing.durationWeeks
--   * StudentProfile.interestedJobTitles
--   * StudentProfile.lastCoverLetter
--
-- The new CompanyRole enum values are added in the preceding migration
-- (20260530090000_company_role_values) so they are committed before the
-- UPDATEs below reference them.

UPDATE "CompanyMember"
   SET "role" = 'FOUNDER_OWNER'
 WHERE "role" = 'OWNER';

UPDATE "CompanyInvitation"
   SET "role" = 'FOUNDER_OWNER'
 WHERE "role" = 'OWNER';

ALTER TABLE "Listing"
    ADD COLUMN "durationWeeks" INTEGER;

ALTER TABLE "StudentProfile"
    ADD COLUMN "interestedJobTitles" "JobTitle"[] NOT NULL DEFAULT ARRAY[]::"JobTitle"[],
    ADD COLUMN "lastCoverLetter" TEXT;
