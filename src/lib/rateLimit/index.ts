import { ApiError } from "@/lib/errors";
import { sr } from "@/content/sr";
import type { RateLimitRule } from "./limits";

export { RATE_LIMITS } from "./limits";
export type { RateLimitRule } from "./limits";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

/** Sprema brojač po ključu u prozoru; implementacija je u prismaRateLimiter.ts, a testovi koriste fake. */
export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/**
 * Troši jedno mjesto u ograničenju. Baca TOO_MANY_REQUESTS (429) sa brojem preostalih minuta
 * kad je limit potrošen. Brojač ne zavisi od toga postoji li nalog, pa odgovor ništa ne otkriva.
 */
export async function enforceRateLimit(
  limiter: RateLimiter | undefined,
  rule: RateLimitRule,
  value: string,
): Promise<void> {
  if (!limiter) return;
  const result = await limiter.consume(`${rule.prefix}:${value.trim().toLowerCase()}`, rule.limit, rule.windowMs);
  if (!result.allowed) {
    throw new ApiError("TOO_MANY_REQUESTS", sr.auth.errors.rateLimited(Math.max(1, Math.ceil(result.retryAfterMs / 60000))));
  }
}
