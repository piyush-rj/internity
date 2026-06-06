-- Add the new CompanyRole enum values in their own migration so they are
-- committed before any later migration references them. Postgres forbids using
-- a freshly-added enum value in the same transaction it was added in, and
-- Prisma applies each migration in its own transaction -- so isolating the
-- ADD VALUEs here keeps `migrate dev` (which replays migrations in a shadow
-- database) happy. The legacy OWNER value is left in place so not-yet-migrated
-- rows still parse; code treats OWNER as a synonym for FOUNDER_OWNER.

ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'FOUNDER_OWNER';
ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'CO_FOUNDER';
ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'HR';
