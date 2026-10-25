import { sr } from "@/content/sr";

/** Obavještenje adminima (ADMIN_EMAILS) kad stigne novi profil na pregled ili nova prijava. */
export interface AdminNotifier {
  profileSubmitted(name: string): Promise<void>;
  reportReceived(): Promise<void>;
}

export interface AdminNotifierDeps {
  email: { send(message: { to: string; subject: string; text: string }): Promise<void> };
  getAdminEmails: () => string[];
  /** Skrivena admin adresa (ADMIN_PATH) ili null kad je admin ugašen; bez nje nema kome ni gdje da se pošalje link. */
  getAdminPath: () => string | null;
  appUrl: () => string;
  /** ADMIN_NOTIFY_EMAILS=false gasi sve mailove ove vrste. */
  isEnabled?: () => boolean;
}

export function isAdminNotifyEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.ADMIN_NOTIFY_EMAILS?.trim().toLowerCase() !== "false";
}

/**
 * Slanje ide poslije commita i nikad ne baca: greška se samo zapiše u log. Idempotentnost obezbjeđuje
 * pozivalac, koji zove notifier tek kad je promjena stvarno upisana (profil prešao u PENDING_REVIEW,
 * prijava kreirana), pa ponovljen zahtjev ne šalje drugi mail. Poruke su obične i bez ličnih detalja
 * osim imena profila.
 */
export function createAdminNotifier(deps: AdminNotifierDeps): AdminNotifier {
  const enabled = deps.isEnabled ?? isAdminNotifyEnabled;

  async function notify(subject: string, text: (link: string) => string, subPath: string) {
    try {
      if (!enabled()) return;
      const adminPath = deps.getAdminPath();
      const recipients = deps.getAdminEmails();
      if (!adminPath || recipients.length === 0) return;
      const link = `${deps.appUrl()}${adminPath}${subPath}`;
      // Zasebna poruka po adminu, da primaoci ne vide tuđe adrese.
      for (const to of recipients) {
        try {
          await deps.email.send({ to, subject, text: text(link) });
        } catch (err) {
          console.error("[admin] slanje obavještenja nije uspjelo:", err);
        }
      }
    } catch (err) {
      console.error("[admin] obavještenje adminima nije poslato:", err);
    }
  }

  const t = sr.admin.emails;
  return {
    profileSubmitted: (name) => notify(t.newProfile.subject, (link) => t.newProfile.body(name, link), ""),
    reportReceived: () => notify(t.newReport.subject, (link) => t.newReport.body(link), "/prijave"),
  };
}
