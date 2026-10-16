import { db } from "@/lib/db";
import type { EmailPreferences } from "@/lib/email/EmailService";

export interface SettingsRecord {
  pausedAt: Date | null;
  cofounderMatchId: string | null;
  hideAge: boolean;
  email: EmailPreferences;
  skippedCount: number;
  // Matchevi za "Sa kim si postao/la co-founder?"
  matches: { matchId: string; firstName: string | null; lastName: string | null }[];
}

export interface SettingsUpdate {
  pausedAt?: Date | null;
  cofounderMatchId?: string | null;
  hideAge?: boolean;
  email?: EmailPreferences;
}

export interface SettingsRepository {
  getSettings(userId: string): Promise<SettingsRecord | null>;
  getEmailPreferences(userId: string): Promise<EmailPreferences | null>;
  isMatchMember(userId: string, matchId: string): Promise<boolean>;
  updateSettings(userId: string, update: SettingsUpdate): Promise<void>;
}

const emailSelect = {
  emailInvites: true,
  emailMessages: true,
  emailReminders: true,
  emailWeekly: true,
  alertOnNewMatch: true,
  emailAnnouncements: true,
  emailEvents: true,
  emailNone: true,
} as const;

const DEFAULT_EMAIL: EmailPreferences = {
  emailInvites: true,
  emailMessages: true,
  emailReminders: true,
  emailWeekly: true,
  alertOnNewMatch: false,
  emailAnnouncements: true,
  emailEvents: true,
  emailNone: false,
};

const nameSelect = { id: true, profile: { select: { firstName: true, lastName: true } } } as const;

export const settingsRepository: SettingsRepository = {
  async getSettings(userId) {
    const [user, preference, profile, skippedCount, matches] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { pausedAt: true, cofounderMatchId: true } }),
      db.preference.findUnique({ where: { userId }, select: emailSelect }),
      db.profile.findUnique({ where: { userId }, select: { hideAge: true } }),
      db.decision.count({ where: { userId, type: "NOT_INTERESTED" } }),
      db.match.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, userA: { select: nameSelect }, userB: { select: nameSelect } },
      }),
    ]);
    if (!user) return null;
    return {
      pausedAt: user.pausedAt,
      cofounderMatchId: user.cofounderMatchId,
      hideAge: profile?.hideAge ?? false,
      email: preference ?? DEFAULT_EMAIL,
      skippedCount,
      matches: matches.map((m) => {
        const other = m.userA.id === userId ? m.userB : m.userA;
        return { matchId: m.id, firstName: other.profile?.firstName ?? null, lastName: other.profile?.lastName ?? null };
      }),
    };
  },

  async getEmailPreferences(userId) {
    return db.preference.findUnique({ where: { userId }, select: emailSelect });
  },

  async isMatchMember(userId, matchId) {
    const match = await db.match.findFirst({
      where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
      select: { id: true },
    });
    return match !== null;
  },

  async updateSettings(userId, update) {
    // User + Preference + Profile u jednoj transakciji (ACID).
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          ...(update.pausedAt !== undefined ? { pausedAt: update.pausedAt } : {}),
          ...(update.cofounderMatchId !== undefined ? { cofounderMatchId: update.cofounderMatchId } : {}),
        },
      }),
      ...(update.email
        ? [db.preference.upsert({ where: { userId }, create: { userId, ...update.email }, update: update.email })]
        : []),
      ...(update.hideAge !== undefined
        ? [db.profile.update({ where: { userId }, data: { hideAge: update.hideAge } })]
        : []),
    ]);
  },
};
