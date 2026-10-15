export * from "./EmailProvider";
export * from "./ConsoleEmailProvider";
export * from "./ResendEmailProvider";

import { ConsoleEmailProvider } from "./ConsoleEmailProvider";
import { ResendEmailProvider } from "./ResendEmailProvider";
import type { EmailProvider } from "./EmailProvider";

export function createEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend") {
    return new ResendEmailProvider(process.env.RESEND_API_KEY ?? "");
  }
  return new ConsoleEmailProvider();
}
