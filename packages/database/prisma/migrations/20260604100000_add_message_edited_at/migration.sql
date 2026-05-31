-- Add an `editedAt` timestamp to Message so the UI can mark edited messages
-- and the server can stamp the edit time. Null = the message was never
-- edited; set on the first (and every subsequent) edit by the sender.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS so re-running after a partial
-- failure is safe.

ALTER TABLE "Message"
    ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
