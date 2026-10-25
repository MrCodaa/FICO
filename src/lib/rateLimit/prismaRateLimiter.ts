import { db } from "@/lib/db";
import type { Clock } from "@/lib/clock";
import type { RateLimiter } from "./index";

/**
 * Fiksni prozor na tabeli LoginAttempt: failedCount = broj upotreba, lockedUntil = kraj prozora.
 * Svaki korak je uslovni updateMany, pa istovremeni zahtjevi ne mogu prekoračiti limit.
 */
export function createPrismaRateLimiter(clock: Clock): RateLimiter {
  return {
    async consume(key, limit, windowMs) {
      const now = clock.now();
      const inWindow = await db.loginAttempt.updateMany({
        where: { key, lockedUntil: { gt: now }, failedCount: { lt: limit } },
        data: { failedCount: { increment: 1 } },
      });
      if (inWindow.count === 1) return { allowed: true };
      const lockedUntil = new Date(now.getTime() + windowMs);
      const expired = await db.loginAttempt.updateMany({
        where: { key, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
        data: { failedCount: 1, lockedUntil },
      });
      if (expired.count === 1) return { allowed: true };
      try {
        await db.loginAttempt.create({ data: { key, failedCount: 1, lockedUntil } });
        return { allowed: true };
      } catch (err) {
        if ((err as { code?: string }).code !== "P2002") throw err;
      }
      const row = await db.loginAttempt.findUnique({ where: { key }, select: { lockedUntil: true } });
      const retryAfterMs = row?.lockedUntil ? Math.max(0, row.lockedUntil.getTime() - now.getTime()) : windowMs;
      return { allowed: false, retryAfterMs };
    },
  };
}
