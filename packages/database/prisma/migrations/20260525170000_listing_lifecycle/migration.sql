-- ============================================================================
-- listing_lifecycle
-- ----------------------------------------------------------------------------
-- Adds expiry + "Not Hiring" pause to listings.
--   expiresAt — set on creation to createdAt + 30 days. Once it passes the
--               listing is hidden from public surfaces; founder renews to
--               bring it back.
--   pausedAt  — non-null = "Not Hiring". Hidden from public browse, existing
--               applicants stay visible to the founder.
--
-- Backfill: every existing listing gets expiresAt = createdAt + 30 days. Rows
-- older than 30 days will show as "Expired" in the founder's manage-listings;
-- they can renew with one click.
-- ============================================================================

ALTER TABLE "Listing"
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "pausedAt"  TIMESTAMP(3);

UPDATE "Listing"
SET "expiresAt" = "createdAt" + INTERVAL '30 days';

CREATE INDEX "Listing_expiresAt_idx" ON "Listing"("expiresAt");
CREATE INDEX "Listing_pausedAt_idx"  ON "Listing"("pausedAt");
