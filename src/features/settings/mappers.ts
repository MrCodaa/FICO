import type { EmailPreferences } from "@/lib/email/EmailService";
import type { SettingsRecord } from "./repository";
import type { EmailSettings } from "./schemas";

export interface SettingsView {
  active: boolean;
  emails: EmailSettings;
  cofounderMatchId: string | null;
  cofounderOptions: { matchId: string; name: string }[];
  hideAge: boolean;
  skippedCount: number;
}

export function toEmailSettings(p: EmailPreferences): EmailSettings {
  return {
    invites: p.emailInvites,
    messages: p.emailMessages,
    reminders: p.emailReminders,
    weekly: p.emailWeekly,
    newMatchingProfile: p.alertOnNewMatch,
    announcements: p.emailAnnouncements,
    events: p.emailEvents,
    none: p.emailNone,
  };
}

export function fromEmailSettings(e: EmailSettings): EmailPreferences {
  return {
    emailInvites: e.invites,
    emailMessages: e.messages,
    emailReminders: e.reminders,
    emailWeekly: e.weekly,
    alertOnNewMatch: e.newMatchingProfile,
    emailAnnouncements: e.announcements,
    emailEvents: e.events,
    emailNone: e.none,
  };
}

export function toSettingsView(record: SettingsRecord): SettingsView {
  return {
    active: record.pausedAt === null,
    emails: toEmailSettings(record.email),
    cofounderMatchId: record.cofounderMatchId,
    cofounderOptions: record.matches.map((m) => ({
      matchId: m.matchId,
      name: [m.firstName, m.lastName].filter(Boolean).join(" ") || "—",
    })),
    hideAge: record.hideAge,
    skippedCount: record.skippedCount,
  };
}
