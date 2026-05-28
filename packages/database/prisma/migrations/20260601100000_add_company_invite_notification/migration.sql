-- Add COMPANY_INVITE to NotificationType so invited users can be notified
-- that a company invited their email to join the team.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMPANY_INVITE' BEFORE 'COMPANY_MEMBER_ADDED';
