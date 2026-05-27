-- Sweeping schema update for the platform overhaul:
--   * Drop ListingType (only internships remain) and ListingDomain (replaced
--     by JobTitle enum, which also has a CUSTOM bucket for free-text titles)
--   * Per-company organisation type + country
--   * Per-employer country (default India)
--   * Multiple resumes per student (capped at 4 by the app layer)
--   * Abuse reports table (LISTING / STUDENT targets, OPEN/RESOLVED/DISMISSED)
--   * Interview timezone, User.activeCompanyId, User.deletedAt

----------------------------------------------------------------------
-- 1. ListingType: collapse to internships only
----------------------------------------------------------------------

-- Strip JOB rows + their dependents so the column drop is clean.
DELETE FROM "Application"  WHERE "listingId" IN (SELECT "id" FROM "Listing" WHERE "type" = 'JOB');
DELETE FROM "SavedListing" WHERE "listingId" IN (SELECT "id" FROM "Listing" WHERE "type" = 'JOB');
DELETE FROM "ListingSkill" WHERE "listingId" IN (SELECT "id" FROM "Listing" WHERE "type" = 'JOB');
DELETE FROM "Listing"      WHERE "type" = 'JOB';

DROP INDEX IF EXISTS "Listing_type_createdAt_idx";
ALTER TABLE "Listing" DROP COLUMN "type";
DROP TYPE "ListingType";

CREATE INDEX "Listing_createdAt_idx" ON "Listing" ("createdAt");

----------------------------------------------------------------------
-- 2. ListingDomain -> JobTitle (+ CUSTOM + customJobTitle text field)
----------------------------------------------------------------------

CREATE TYPE "JobTitle" AS ENUM (
  'AI', 'BACKEND', 'WEB', 'MOBILE', 'QA',
  'DESIGN', 'PRODUCT', 'MARKETING', 'CONTENT',
  'SALES', 'DATA', 'HR', 'CUSTOM'
);

ALTER TABLE "Listing" ADD COLUMN "jobTitle"       "JobTitle";
ALTER TABLE "Listing" ADD COLUMN "customJobTitle" TEXT;

-- Backfill: domain values mirror JobTitle 1:1 except OTHER -> CUSTOM.
UPDATE "Listing"
   SET "jobTitle" = (CASE WHEN "domain"::TEXT = 'OTHER' THEN 'CUSTOM' ELSE "domain"::TEXT END)::"JobTitle"
 WHERE "domain" IS NOT NULL;

ALTER TABLE "Listing" DROP COLUMN "domain";
DROP TYPE "ListingDomain";

CREATE INDEX "Listing_jobTitle_idx" ON "Listing" ("jobTitle");

----------------------------------------------------------------------
-- 3. OrganizationType + Company.country / Company.organizationType
----------------------------------------------------------------------

CREATE TYPE "OrganizationType" AS ENUM (
  'SOLO_FOUNDER', 'STARTUP_TEAM', 'BOOTSTRAPPED_STARTUP',
  'PRIVATE_LIMITED', 'LLP', 'AGENCY',
  'FREELANCER', 'STUDENT_STARTUP', 'OTHER'
);

ALTER TABLE "Company" ADD COLUMN "country"          TEXT DEFAULT 'India';
ALTER TABLE "Company" ADD COLUMN "organizationType" "OrganizationType";

----------------------------------------------------------------------
-- 4. EmployerProfile.country
----------------------------------------------------------------------

ALTER TABLE "EmployerProfile" ADD COLUMN "country" TEXT DEFAULT 'India';

----------------------------------------------------------------------
-- 5. Interview.timezone
----------------------------------------------------------------------

ALTER TABLE "Interview" ADD COLUMN "timezone" TEXT;

----------------------------------------------------------------------
-- 6. User: soft-delete + activeCompanyId
----------------------------------------------------------------------

ALTER TABLE "User" ADD COLUMN "deletedAt"       TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "activeCompanyId" TEXT;

ALTER TABLE "User"
  ADD CONSTRAINT "User_activeCompanyId_fkey"
  FOREIGN KEY ("activeCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_deletedAt_idx" ON "User" ("deletedAt");

-- Seed activeCompanyId for existing owners so they don't lose context on
-- first load. Pick their oldest company.
UPDATE "User" u
   SET "activeCompanyId" = sub."companyId"
  FROM (
    SELECT DISTINCT ON ("userId") "userId", "companyId"
      FROM "CompanyMember"
     ORDER BY "userId", "joinedAt" ASC
  ) AS sub
 WHERE u."id" = sub."userId" AND u."activeCompanyId" IS NULL;

----------------------------------------------------------------------
-- 7. Resume table + backfill from StudentProfile.resumeUrl
----------------------------------------------------------------------

CREATE TABLE "Resume" (
  "id"         TEXT NOT NULL,
  "studentId"  TEXT NOT NULL,
  "assetId"    TEXT,
  "fileName"   TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "sizeBytes"  INTEGER,
  "isDefault"  BOOLEAN NOT NULL DEFAULT false,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Resume_studentId_idx" ON "Resume" ("studentId");
CREATE INDEX "Resume_assetId_idx"   ON "Resume" ("assetId");

ALTER TABLE "Resume"
  ADD CONSTRAINT "Resume_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Resume"
  ADD CONSTRAINT "Resume_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every student who already has a resumeUrl gets a single
-- isDefault row in Resume. Skip if a row already exists for the same URL.
INSERT INTO "Resume" ("id", "studentId", "fileName", "url", "isDefault", "createdAt")
SELECT
  'res_' || replace(gen_random_uuid()::text, '-', ''),
  sp."id",
  'Resume',
  sp."resumeUrl",
  true,
  CURRENT_TIMESTAMP
  FROM "StudentProfile" sp
 WHERE sp."resumeUrl" IS NOT NULL
   AND NOT EXISTS (
         SELECT 1 FROM "Resume" r
          WHERE r."studentId" = sp."id" AND r."url" = sp."resumeUrl"
       );

----------------------------------------------------------------------
-- 8. Report table + supporting enums
----------------------------------------------------------------------

CREATE TYPE "ReportTargetType" AS ENUM ('LISTING', 'STUDENT');
CREATE TYPE "ReportStatus"     AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE "Report" (
  "id"              TEXT NOT NULL,
  "reporterId"      TEXT NOT NULL,
  "targetType"      "ReportTargetType" NOT NULL,
  "targetListingId" TEXT,
  "targetStudentId" TEXT,
  "reason"          TEXT NOT NULL,
  "status"          "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedById"    TEXT,
  "resolvedAt"      TIMESTAMP(3),
  "resolutionNote"  TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_status_createdAt_idx"  ON "Report" ("status", "createdAt");
CREATE INDEX "Report_targetListingId_idx"   ON "Report" ("targetListingId");
CREATE INDEX "Report_targetStudentId_idx"   ON "Report" ("targetStudentId");
CREATE INDEX "Report_reporterId_idx"        ON "Report" ("reporterId");

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_targetListingId_fkey"
  FOREIGN KEY ("targetListingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_targetStudentId_fkey"
  FOREIGN KEY ("targetStudentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
