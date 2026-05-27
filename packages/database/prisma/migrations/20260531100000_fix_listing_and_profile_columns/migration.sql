-- Fixup for 20260530100000_company_roles_and_listing_fields.
--
-- That migration used a `COMMIT; BEGIN;` dance so the freshly-added enum
-- values (FOUNDER_OWNER, CO_FOUNDER, HR) would be visible to a subsequent
-- UPDATE in the same script. The trailing BEGIN left an open transaction
-- that Prisma rolled back when the connection closed, so the column adds
-- and OWNER->FOUNDER_OWNER UPDATEs never landed even though the migration
-- was marked applied. The enum values themselves stuck because they were
-- committed before the rollback.
--
-- This migration is fully idempotent (uses IF NOT EXISTS / WHERE filters)
-- so it's safe to re-run and safe for fresh clones — `migrate deploy`
-- runs both migrations in sequence, and this one finishes whatever the
-- broken one left undone.

ALTER TABLE "Listing"
    ADD COLUMN IF NOT EXISTS "durationWeeks" INTEGER;

ALTER TABLE "StudentProfile"
    ADD COLUMN IF NOT EXISTS "interestedJobTitles" "JobTitle"[]
        NOT NULL DEFAULT ARRAY[]::"JobTitle"[];

ALTER TABLE "StudentProfile"
    ADD COLUMN IF NOT EXISTS "lastCoverLetter" TEXT;

-- Idempotent backfill: only flips rows still on the legacy OWNER label.
UPDATE "CompanyMember"
   SET "role" = 'FOUNDER_OWNER'
 WHERE "role" = 'OWNER';

UPDATE "CompanyInvitation"
   SET "role" = 'FOUNDER_OWNER'
 WHERE "role" = 'OWNER';
