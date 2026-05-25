-- Google OAuth tokens for Calendar API / Meet link generation. Stored on
-- the User row so any role (founder today, potentially recruiter teams
-- later) can connect their own Google account.

ALTER TABLE "User"
  ADD COLUMN "googleRefreshToken"   TEXT,
  ADD COLUMN "googleAccessToken"    TEXT,
  ADD COLUMN "googleTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "googleConnectedEmail" TEXT;
