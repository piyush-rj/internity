-- ============================================================================
-- student_profile_links
-- ----------------------------------------------------------------------------
-- Personal LinkedIn + portfolio URLs for students. Both optional. Listed in
-- the spec's profile fields ("LinkedIn URL", "Portfolio Link") and surfaced
-- on the public student profile page so founders can vet applicants.
-- ============================================================================

ALTER TABLE "StudentProfile"
  ADD COLUMN "linkedinUrl"  TEXT,
  ADD COLUMN "portfolioUrl" TEXT;
