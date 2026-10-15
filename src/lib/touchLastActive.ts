import { db } from "@/lib/db";
import { systemClock, type Clock } from "@/lib/clock";

const ONE_HOUR_MS = 60 * 60 * 1000;

// Ažurira User.lastActiveAt najviše jednom na sat (uslovni updateMany, bez race-a).
export async function touchLastActive(userId: string, clock: Clock = systemClock) {
  const now = clock.now();
  await db.user.updateMany({
    where: {
      id: userId,
      lastActiveAt: { lt: new Date(now.getTime() - ONE_HOUR_MS) },
    },
    data: { lastActiveAt: now },
  });
}
