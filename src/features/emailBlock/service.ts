import type { Clock } from "@/lib/clock";
import type { EmailBlockRepository } from "./repository";

export interface ResendWebhookEvent {
  type?: unknown;
  data?: {
    to?: unknown;
    bounce?: { type?: unknown } | null;
  } | null;
}

export interface EmailBlockServiceDeps {
  repo: Pick<EmailBlockRepository, "blockByEmail">;
  clock: Clock;
}

/** Resend webhook: tvrdi bounce i prijava spama (complaint) blokiraju adresu. Meki bounce (Transient/Undetermined) se ignoriše. */
export function createEmailBlockService(deps: EmailBlockServiceDeps) {
  const { repo, clock } = deps;

  /** Vraća razlog blokade ako je događaj blokirajući, inače null. */
  function reasonFor(event: ResendWebhookEvent): "bounced" | "complained" | null {
      if (event.type === "email.complained") return "complained";
      if (event.type === "email.bounced") {
        const bounceType = event.data?.bounce?.type;
        if (typeof bounceType === "string" && bounceType.toLowerCase() === "permanent") return "bounced";
      }
      return null;
  }

  return {
    reasonFor,

    async handleResendEvent(event: ResendWebhookEvent): Promise<{ blocked: number }> {
      const reason = reasonFor(event);
      if (!reason) return { blocked: 0 };
      const to = event.data?.to;
      const recipients = (Array.isArray(to) ? to : typeof to === "string" ? [to] : []).filter(
        (r): r is string => typeof r === "string",
      );
      let blocked = 0;
      for (const recipient of recipients) {
        if (await repo.blockByEmail(recipient, reason, clock.now())) blocked++;
      }
      return { blocked };
    },
  };
}

export type EmailBlockService = ReturnType<typeof createEmailBlockService>;
