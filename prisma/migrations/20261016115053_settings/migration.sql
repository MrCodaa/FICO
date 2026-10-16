-- AlterTable
ALTER TABLE "Preference" ADD COLUMN     "emailAnnouncements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailEvents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailInvites" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailWeekly" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "hideAge" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cofounderMatchId" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cofounderMatchId_fkey" FOREIGN KEY ("cofounderMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
