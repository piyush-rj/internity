-- ============================================================================
-- company_verification
-- ----------------------------------------------------------------------------
-- Adds the admin verification gate for companies. A company starts PENDING
-- and cannot have listings created against it until an admin transitions it
-- to APPROVED. Existing companies (created before this migration) are
-- grandfathered as APPROVED so we don't break any seed data / dev flows.
-- ============================================================================

-- 1. Enum
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. Columns. verificationStatus is initially nullable so we can backfill
--    existing rows to APPROVED before locking in NOT NULL.
ALTER TABLE "Company"
  ADD COLUMN "linkedinUrl"        TEXT,
  ADD COLUMN "foundingYear"       INTEGER,
  ADD COLUMN "verificationStatus" "CompanyVerificationStatus",
  ADD COLUMN "rejectionNote"      TEXT,
  ADD COLUMN "submittedAt"        TIMESTAMP(3),
  ADD COLUMN "approvedAt"         TIMESTAMP(3);

-- 3. Grandfather existing companies as APPROVED. submittedAt + approvedAt
--    fall back to createdAt so the admin queue ordering still works.
UPDATE "Company"
SET "verificationStatus" = 'APPROVED',
    "submittedAt"        = "createdAt",
    "approvedAt"         = "createdAt";

-- 4. Lock in defaults + NOT NULL on status.
ALTER TABLE "Company"
  ALTER COLUMN "verificationStatus" SET NOT NULL,
  ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';

-- 5. Index to make the admin verification queue fast.
CREATE INDEX "Company_verificationStatus_submittedAt_idx"
  ON "Company"("verificationStatus", "submittedAt");

-- 6. Notification enum: add the two new admin-decision types.
ALTER TYPE "NotificationType" ADD VALUE 'COMPANY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'COMPANY_REJECTED';
