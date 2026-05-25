-- ============================================================================
-- listing_takedown
-- ----------------------------------------------------------------------------
-- Soft-removal so admin can hide a listing from public browse without losing
-- the data. The founder still sees it (marked "Removed by admin") and can
-- read the takedown reason. An admin can restore later by clearing these
-- columns.
-- ============================================================================

ALTER TABLE "Listing"
  ADD COLUMN "takenDownAt"    TIMESTAMP(3),
  ADD COLUMN "takedownReason" TEXT,
  ADD COLUMN "takenDownById"  TEXT;

ALTER TABLE "Listing"
  ADD CONSTRAINT "Listing_takenDownById_fkey"
    FOREIGN KEY ("takenDownById") REFERENCES "User"(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Listing_takenDownAt_idx" ON "Listing"("takenDownAt");

-- Two new notification types for the takedown/restore lifecycle.
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_TAKEN_DOWN';
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_RESTORED';
