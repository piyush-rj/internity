-- ============================================================================
-- conversation_per_pair
-- ----------------------------------------------------------------------------
-- Re-base the chat thread on (student, recruiter) instead of (application).
-- The old model gave every Application its own Conversation, so applying to
-- two listings from the same recruiter produced two duplicate threads. This
-- migration:
--
--   1. Adds owner columns (studentId, recruiterId) to Conversation and a
--      back-reference column (conversationId) to Application.
--   2. Backfills them from each existing Conversation's Application.
--   3. Merges any duplicates that exist for the same (student, recruiter)
--      pair — messages, read pointers, and applications all redirect to the
--      oldest Conversation as canonical.
--   4. Drops the old applicationId column + unique index and locks in the
--      new constraints.
--
-- Idempotent over an empty DB; safe over a non-empty one because the merge
-- step is a no-op when no duplicates exist.
-- ============================================================================

-- 1. New columns. Nullable until backfill is done.
ALTER TABLE "Conversation"
  ADD COLUMN "studentId" TEXT,
  ADD COLUMN "recruiterId" TEXT;

ALTER TABLE "Application"
  ADD COLUMN "conversationId" TEXT;

-- 2. Populate Conversation owners from the Application/Listing chain.
UPDATE "Conversation" c
SET "studentId"   = a."studentId",
    "recruiterId" = l."postedById"
FROM "Application" a
JOIN "Listing" l ON l.id = a."listingId"
WHERE c."applicationId" = a.id;

-- Defensive: drop any orphan conversations whose application was already
-- deleted (shouldn't exist thanks to ON DELETE CASCADE, but cheap to guard).
DELETE FROM "Conversation"
WHERE "studentId" IS NULL OR "recruiterId" IS NULL;

-- 3. Build a remap: every conversation -> the oldest sibling for its pair.
CREATE TEMP TABLE _conv_remap AS
SELECT
  c.id AS original_id,
  FIRST_VALUE(c.id) OVER (
    PARTITION BY c."studentId", c."recruiterId"
    ORDER BY c."createdAt" ASC, c.id ASC
  ) AS canonical_id
FROM "Conversation" c;

-- 4a. Merge ConversationRead pointers: if both canonical and non-canonical
--     have a row for the same user, keep the latest lastReadAt on the
--     canonical row.
UPDATE "ConversationRead" canon
SET "lastReadAt" = GREATEST(canon."lastReadAt", non_canon."lastReadAt")
FROM "ConversationRead" non_canon
JOIN _conv_remap r ON r.original_id = non_canon."conversationId"
WHERE canon."conversationId" = r.canonical_id
  AND canon."userId"         = non_canon."userId"
  AND r.original_id <> r.canonical_id;

-- 4b. For non-canonical reads that DON'T collide on the canonical, redirect
--     them onto the canonical conversation.
UPDATE "ConversationRead" cr
SET "conversationId" = r.canonical_id
FROM _conv_remap r
WHERE cr."conversationId" = r.original_id
  AND r.original_id <> r.canonical_id
  AND NOT EXISTS (
    SELECT 1 FROM "ConversationRead" canon
    WHERE canon."conversationId" = r.canonical_id
      AND canon."userId"         = cr."userId"
  );

-- 4c. Any remaining non-canonical reads were absorbed via the MAX merge in 4a.
DELETE FROM "ConversationRead" cr
USING _conv_remap r
WHERE cr."conversationId" = r.original_id
  AND r.original_id <> r.canonical_id;

-- 5. Move messages onto the canonical conversation.
UPDATE "Message" m
SET "conversationId" = r.canonical_id
FROM _conv_remap r
WHERE m."conversationId" = r.original_id
  AND r.original_id <> r.canonical_id;

-- 6. Wire every application to its canonical conversation.
UPDATE "Application" a
SET "conversationId" = r.canonical_id
FROM "Conversation" c
JOIN _conv_remap r ON r.original_id = c.id
WHERE c."applicationId" = a.id;

-- 7. Drop the duplicate (non-canonical) conversations. They have no remaining
--    rows referencing them after steps 4–6.
DELETE FROM "Conversation" c
USING _conv_remap r
WHERE c.id = r.original_id
  AND r.original_id <> r.canonical_id;

DROP TABLE _conv_remap;

-- 8. Refresh lastMessageAt so it reflects the merged message set.
UPDATE "Conversation" c
SET "lastMessageAt" = COALESCE(
  (SELECT MAX("createdAt") FROM "Message" WHERE "conversationId" = c.id),
  c."lastMessageAt"
);

-- 9. Drop the old applicationId column (its unique index + FK go with it).
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_applicationId_fkey";
ALTER TABLE "Conversation" DROP COLUMN "applicationId";

-- 10. Lock in NOT NULL on the new owner columns.
ALTER TABLE "Conversation"
  ALTER COLUMN "studentId"   SET NOT NULL,
  ALTER COLUMN "recruiterId" SET NOT NULL;

-- 11. Constraints + indexes matching the updated Prisma schema.
ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Conversation_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Conversation_studentId_recruiterId_key"
  ON "Conversation"("studentId", "recruiterId");
CREATE INDEX "Conversation_studentId_idx"   ON "Conversation"("studentId");
CREATE INDEX "Conversation_recruiterId_idx" ON "Conversation"("recruiterId");

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Application_conversationId_idx" ON "Application"("conversationId");
