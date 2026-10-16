import type { EmailMessage, EmailProvider } from "./EmailProvider";

// Lifecycle mailovi (zahtjevi, matchevi, novosti…) poštuju Podešavanja →
// "Koje emailove želiš da primaš?". Transakcioni (potvrda emaila, reset
// lozinke, odobren/odbijen profil) idu uvijek — šalju se bez `lifecycle`.

export type EmailCategory =
  | "invites" // Novi zahtjevi i matchevi
  | "messages" // Nova poruka od matcha
  | "reminders" // Podsjetnici da odgovoriš na zahtjeve
  | "weekly" // Sedmične novosti i predlozi profila
  | "newMatchingProfile" // Novi profil koji odgovara svim preferencama (alertOnNewMatch)
  | "announcements" // Najave novih funkcija
  | "events"; // Pozivi na događaje uživo

export interface EmailPreferences {
  emailInvites: boolean;
  emailMessages: boolean;
  emailReminders: boolean;
  emailWeekly: boolean;
  alertOnNewMatch: boolean;
  emailAnnouncements: boolean;
  emailEvents: boolean;
  emailNone: boolean;
}

const FLAG: Record<EmailCategory, keyof EmailPreferences> = {
  invites: "emailInvites",
  messages: "emailMessages",
  reminders: "emailReminders",
  weekly: "emailWeekly",
  newMatchingProfile: "alertOnNewMatch",
  announcements: "emailAnnouncements",
  events: "emailEvents",
};

/** emailNone gasi sve lifecycle mailove; inače odlučuje checkbox kategorije. Bez zapisa → podrazumijevano šalji. */
export function allowsLifecycleEmail(prefs: EmailPreferences | null, category: EmailCategory): boolean {
  if (!prefs) return true;
  if (prefs.emailNone) return false;
  return prefs[FLAG[category]];
}

export interface LifecycleOptions {
  userId: string;
  category: EmailCategory;
}

export interface EmailService {
  send(message: EmailMessage, lifecycle?: LifecycleOptions): Promise<void>;
}

export function createEmailService(deps: {
  provider: EmailProvider;
  getPreferences: (userId: string) => Promise<EmailPreferences | null>;
}): EmailService {
  return {
    async send(message, lifecycle) {
      if (lifecycle) {
        const prefs = await deps.getPreferences(lifecycle.userId);
        if (!allowsLifecycleEmail(prefs, lifecycle.category)) return;
      }
      await deps.provider.send(message);
    },
  };
}
