-- Top-level College + Branch shortcuts on StudentProfile. The Education[]
-- list still holds the full academic history; these are the summary fields
-- founders see on applicant cards and use for filtering/sorting.

ALTER TABLE "StudentProfile"
  ADD COLUMN "college" TEXT,
  ADD COLUMN "branch"  TEXT;
