-- ============================================================================
-- interview_schema
-- ----------------------------------------------------------------------------
-- One scheduled meeting (video or phone) between a founder and an applicant.
-- Tied to an Application; multiple interviews per application are allowed
-- (rescheduling, multiple rounds). App-layer rule enforces "at most one
-- SCHEDULED at a time".
-- ============================================================================

CREATE TYPE "InterviewType" AS ENUM ('VIDEO', 'PHONE');

CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

ALTER TYPE "NotificationType"
  ADD VALUE IF NOT EXISTS 'INTERVIEW_SCHEDULED';

ALTER TYPE "NotificationType"
  ADD VALUE IF NOT EXISTS 'INTERVIEW_CANCELLED';

CREATE TABLE "Interview" (
  "id"             TEXT             NOT NULL,
  "applicationId"  TEXT             NOT NULL,
  "hostId"         TEXT             NOT NULL,
  "candidateId"    TEXT             NOT NULL,
  "title"          TEXT             NOT NULL,
  "type"           "InterviewType"  NOT NULL,
  "scheduledAt"    TIMESTAMP(3)     NOT NULL,
  "endsAt"         TIMESTAMP(3)     NOT NULL,
  "meetingLink"    TEXT,
  "hostPhone"      TEXT,
  "candidatePhone" TEXT,
  "description"    TEXT,
  "status"         "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
  "cancelledAt"    TIMESTAMP(3),
  "cancelReason"   TEXT,
  "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Interview_candidateId_scheduledAt_idx"
  ON "Interview" ("candidateId", "scheduledAt");

CREATE INDEX "Interview_hostId_scheduledAt_idx"
  ON "Interview" ("hostId", "scheduledAt");

CREATE INDEX "Interview_applicationId_idx"
  ON "Interview" ("applicationId");

ALTER TABLE "Interview"
  ADD CONSTRAINT "Interview_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Interview"
  ADD CONSTRAINT "Interview_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Interview"
  ADD CONSTRAINT "Interview_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
