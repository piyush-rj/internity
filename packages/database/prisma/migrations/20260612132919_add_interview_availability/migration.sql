-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "interviewDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interviewEndTime" TEXT,
ADD COLUMN     "interviewStartTime" TEXT;
