-- ============================================================================
-- application_seen_at
-- ----------------------------------------------------------------------------
-- Tracks when a founder first opened the applicants page for the listing
-- this application is on. Orthogonal to `status` so a founder can both
-- "see" an applicant and then move them through SHORTLISTED / HIRED / etc.
-- The student-side tracker surfaces "Seen by company" the first time this
-- becomes non-null.
-- ============================================================================

ALTER TABLE "Application" ADD COLUMN "seenAt" TIMESTAMP(3);
