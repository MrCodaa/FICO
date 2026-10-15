import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./EmailProvider";

export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    await this.client.emails.send({
      from: process.env.EMAIL_FROM ?? "",
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
