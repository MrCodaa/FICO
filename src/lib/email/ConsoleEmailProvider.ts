import type { EmailMessage, EmailProvider } from "./EmailProvider";

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email] to=${message.to} subject="${message.subject}"\n${message.text}`);
  }
}
