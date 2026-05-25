-- ============================================================================
-- employer_linkedin_url
-- ----------------------------------------------------------------------------
-- Personal LinkedIn URL for the founder. Surfaced on the public internship
-- detail page next to the founder's name so students can vet who they're
-- applying to. Optional — falls back to the company's LinkedIn when missing.
-- ============================================================================

ALTER TABLE "EmployerProfile" ADD COLUMN "linkedinUrl" TEXT;
