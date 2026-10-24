import type { EmailSettings } from "./schemas";

// "Bez ikakvih lifecycle emailova" gasi sve ostale opcije: kad je uključeno,
// sve ostale su false (i na formi i na serveru). Kad se odčekira, vraćaju se
// vrijednosti od prije uključivanja; ako njih nema (npr. nakon ponovnog učitavanja
// stranice, jer server čuva samo isključeno stanje) uključene su sve opcije.

const KEYS = ["invites", "messages", "reminders", "weekly", "newMatchingProfile", "announcements", "events"] as const;

export function disableAllEmails(): EmailSettings {
  return { invites: false, messages: false, reminders: false, weekly: false, newMatchingProfile: false, announcements: false, events: false, none: true };
}

export function restoreEmails(previous: EmailSettings | null): EmailSettings {
  const base = previous && !previous.none && KEYS.some((k) => previous[k]) ? previous : null;
  return {
    invites: base?.invites ?? true,
    messages: base?.messages ?? true,
    reminders: base?.reminders ?? true,
    weekly: base?.weekly ?? true,
    newMatchingProfile: base?.newMatchingProfile ?? true,
    announcements: base?.announcements ?? true,
    events: base?.events ?? true,
    none: false,
  };
}

/** Server: kad je `none` uključeno, sve ostale opcije se čuvaju kao false. */
export function normalizeEmails(e: EmailSettings): EmailSettings {
  return e.none ? disableAllEmails() : e;
}
