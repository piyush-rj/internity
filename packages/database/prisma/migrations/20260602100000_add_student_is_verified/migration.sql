-- Admin-toggled verification badge on StudentProfile. Display-only.
ALTER TABLE "StudentProfile" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
