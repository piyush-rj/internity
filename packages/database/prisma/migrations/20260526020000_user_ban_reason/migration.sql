-- ============================================================================
-- user_ban_reason
-- ----------------------------------------------------------------------------
-- Captures the admin's reason when deactivating a user, plus the timestamp.
-- Surfaced back in the user's "Account disabled" 403 message and on the
-- admin overlay so admins can audit past bans.
-- ============================================================================

ALTER TABLE "User"
  ADD COLUMN "banReason" TEXT,
  ADD COLUMN "bannedAt"  TIMESTAMP(3);
