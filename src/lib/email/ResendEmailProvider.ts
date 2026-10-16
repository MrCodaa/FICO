import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./EmailProvider";

// Resendova test adresa radi bez verifikovanog domena (ali tada šalje samo na
// email vlasnika Resend naloga). Kad se domen verifikuje, upiši EMAIL_FROM.
export const DEFAULT_EMAIL_FROM = "FICO <onboarding@resend.dev>";

function senderAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from || from.includes("@example.com")) return DEFAULT_EMAIL_FROM;
  return from;
}

export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    // Resend SDK rezolvuje normalno i kad dostava ne uspije (npr. loš API
    // ključ, neverifikovan EMAIL_FROM) — rezultat nosi { error }, ne baca.
    const result = await this.client.emails.send({
      from: senderAddress(),
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    if (result.error) {
      throw new Error(`Resend slanje nije uspjelo: ${result.error.message}`);
    }
  }
}
