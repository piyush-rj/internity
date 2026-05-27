-- Adds the "to" half of the start-date range. Existing rows just keep
-- startDate as the single target; new posts can express a range when the
-- employer picks "Later" with both From and To.

ALTER TABLE "Listing" ADD COLUMN "startDateLatest" TIMESTAMP(3);
