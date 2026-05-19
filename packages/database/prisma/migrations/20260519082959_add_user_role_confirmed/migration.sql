-- AlterTable
ALTER TABLE "User" ADD COLUMN "roleConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- Seeded users and Piyush already have meaningful roles set — flip their
-- flag so the RoleGate doesn't pop the picker at them on next sign-in.
UPDATE "User" SET "roleConfirmed" = true WHERE "role" IN ('STUDENT', 'EMPLOYER', 'ADMIN');
