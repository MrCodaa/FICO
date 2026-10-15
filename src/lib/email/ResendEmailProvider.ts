import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./EmailProvider";

export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    // Resend SDK rezolvuje normalno i kad dostava ne uspije (npr. loš API
    // ključ, neverifikovan EMAIL_FROM) — rezultat nosi { error }, ne baca.
    const result = await this.client.emails.send({
      from: process.env.EMAIL_FROM ?? "",
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    if (result.error) {
      throw new Error(`Resend slanje nije uspjelo: ${result.error.message}`);
    }
  }
}
