import { db } from "@/lib/db";

export interface EmailBlockRepository {
  isEmailBlocked(email: string): Promise<boolean>;
  /** Vraća true ako je korisnik nađen (i blok upisan). */
  blockByEmail(email: string, reason: string, now: Date): Promise<boolean>;
}

export const emailBlockRepository: EmailBlockRepository = {
  async isEmailBlocked(email) {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { emailBlockedAt: true },
    });
    return user?.emailBlockedAt != null;
  },

  async blockByEmail(email, reason, now) {
    const result = await db.user.updateMany({
      where: { email: email.trim().toLowerCase() },
      data: { emailBlockedAt: now, emailBlockReason: reason },
    });
    return result.count > 0;
  },
};
