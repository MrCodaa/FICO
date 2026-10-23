-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailBlockReason" TEXT,
ADD COLUMN     "emailBlockedAt" TIMESTAMP(3);
