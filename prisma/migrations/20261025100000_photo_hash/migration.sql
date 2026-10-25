-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "photoDHash" TEXT,
ADD COLUMN     "photoFlagNote" TEXT,
ADD COLUMN     "photoFlaggedAt" TIMESTAMP(3),
ADD COLUMN     "photoHash" TEXT;

-- CreateIndex
CREATE INDEX "Profile_photoHash_idx" ON "Profile"("photoHash");
