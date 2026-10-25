// Sva ograničenja učestalosti na jednom mjestu. Ključ je "prefix:vrijednost" u tabeli LoginAttempt
// (isti mehanizam kao prijava i otpremanje slike), pa nova migracija nije potrebna.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface RateLimitRule {
  /** Prefiks ključa; ključ je `${prefix}:${vrijednost}`. */
  prefix: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  registerIp: { prefix: "register-ip", limit: 5, windowMs: HOUR },
  forgotEmail: { prefix: "forgot-email", limit: 3, windowMs: HOUR },
  forgotIp: { prefix: "forgot-ip", limit: 10, windowMs: HOUR },
  resendEmail: { prefix: "resend-email", limit: 3, windowMs: HOUR },
  resendIp: { prefix: "resend-ip", limit: 10, windowMs: HOUR },
  reportUser: { prefix: "report-user", limit: 10, windowMs: DAY },
  chatUser: { prefix: "chat-user", limit: 30, windowMs: MINUTE },
} as const satisfies Record<string, RateLimitRule>;
