-- ============================================================================
-- screening_questions
-- ----------------------------------------------------------------------------
-- Founder-defined questions on a Listing that the student must answer at
-- apply time. Stored as parallel String[] arrays so we don't need a separate
-- join table for the MVP — order and count match between Listing and
-- Application. Capped to 5 questions at the validation layer.
-- ============================================================================

ALTER TABLE "Listing"
  ADD COLUMN "screeningQuestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Application"
  ADD COLUMN "screeningAnswers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
