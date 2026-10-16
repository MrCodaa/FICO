export * from "./EmailProvider";
export * from "./ConsoleEmailProvider";
export * from "./ResendEmailProvider";
export * from "./EmailService";

import { ConsoleEmailProvider } from "./ConsoleEmailProvider";
import { ResendEmailProvider } from "./ResendEmailProvider";
import type { EmailProvider } from "./EmailProvider";

// EMAIL_PROVIDER=console | resend bira ručno; prazno → Resend čim postoji
// RESEND_API_KEY, inače mailovi idu u log (ConsoleEmailProvider).
export function createEmailProvider(): EmailProvider {
  const mode = process.env.EMAIL_PROVIDER?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (mode === "resend" || (!mode && apiKey)) {
    return new ResendEmailProvider(apiKey);
  }
  return new ConsoleEmailProvider();
}
