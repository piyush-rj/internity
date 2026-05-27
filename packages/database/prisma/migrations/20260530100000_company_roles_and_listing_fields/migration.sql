-- Add the new CompanyRole values, migrate legacy OWNER rows to FOUNDER_OWNER,
-- and add the small set of new columns powering the post-listing + student
-- profile + apply form refresh:
--   * Listing.durationWeeks
--   * StudentProfile.interestedJobTitles
--   * StudentProfile.lastCoverLetter
--
-- The legacy OWNER enum value stays in the schema so any not-yet-migrated row
-- still parses; the code path treats OWNER as a synonym for FOUNDER_OWNER.

ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'FOUNDER_OWNER';
ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'CO_FOUNDER';
ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'HR';

-- New values must be committed before they can be referenced in UPDATEs.
COMMIT;
BEGIN;

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
