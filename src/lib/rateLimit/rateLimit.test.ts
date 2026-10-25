import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { createAuthService } from "@/features/auth/service";
import type { AuthRepository } from "@/features/auth/repository";
import { createSafetyService } from "@/features/safety/service";
import type { SafetyRepository } from "@/features/safety/repository";
import { createChatService } from "@/features/chat/service";
import type { ChatRepository } from "@/features/chat/repository";
import { RATE_LIMITS, enforceRateLimit, type RateLimiter } from "./index";

process.env.JWT_SECRET ??= "test-secret-for-vitest";
const clock = { now: () => new Date("2026-01-01T00:00:00Z") };

/** Brojač u memoriji sa istim ugovorom kao Prisma implementacija (fiksni prozor). */
function memoryLimiter(): RateLimiter & { keys: string[] } {
  const counts = new Map<string, number>();
  const keys: string[] = [];
  return {
    keys,
    async consume(key, limit, windowMs) {
      keys.push(key);
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n <= limit ? { allowed: true } : { allowed: false, retryAfterMs: windowMs };
    },
  };
}

async function expectRateLimited(promise: Promise<unknown>, minutes: number) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).code).toBe("TOO_MANY_REQUESTS");
  expect((err as ApiError).status).toBe(429);
  expect((err as ApiError).message).toBe(`Greška: previše pokušaja. Pokušaj ponovo za ${minutes} min.`);
}

describe("enforceRateLimit", () => {
  it("propušta do limita, pa baca 429 sa minutama do kraja prozora", async () => {
    const limiter = memoryLimiter();
    const rule = { prefix: "t", limit: 2, windowMs: 90 * 60 * 1000 };
    await enforceRateLimit(limiter, rule, "A");
    await enforceRateLimit(limiter, rule, "a");
    await expectRateLimited(enforceRateLimit(limiter, rule, "a"), 90);
    expect(limiter.keys[0]).toBe("t:a");
  });

  it("bez limitera ne radi ništa", async () => {
    await expect(enforceRateLimit(undefined, RATE_LIMITS.chatUser, "u")).resolves.toBeUndefined();
  });
});

describe("limiti u servisima", () => {
  const authRepo = {
    findMeById: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.com", emailVerifiedAt: null }),
    findLatestAuthToken: vi.fn().mockResolvedValue(null),
    createAuthToken: vi.fn().mockResolvedValue(undefined),
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createUserWithProfile: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.com" }),
  } as unknown as AuthRepository;
  const email = { send: vi.fn().mockResolvedValue(undefined) };

  it("register: 6. pokušaj sa iste IP adrese je odbijen", async () => {
    const service = createAuthService({
      repo: authRepo,
      email,
      clock,
      rateLimiter: memoryLimiter(),
      emailDomainExists: async () => true,
    });
    const input = { firstName: "A", lastName: "B", email: "a@b.com", password: "password1", linkedinUrl: null, noLinkedin: true };
    for (let i = 0; i < RATE_LIMITS.registerIp.limit; i++) await service.register(input, "9.9.9.9");
    await expectRateLimited(service.register(input, "9.9.9.9"), 60);
    await expect(service.register(input, "8.8.8.8")).resolves.toBeDefined();
  });

  it("forgotPassword: 3 po mejlu i 10 po IP u satu, isti ishod za nepostojeći nalog", async () => {
    const service = createAuthService({ repo: authRepo, email, clock, rateLimiter: memoryLimiter() });
    for (let i = 0; i < 3; i++) await expect(service.forgotPassword({ email: "x@y.com" }, "1.1.1.1")).resolves.toBeUndefined();
    await expectRateLimited(service.forgotPassword({ email: "X@y.com" }, "1.1.1.1"), 60);
    // Druga adresa, ista IP: troši IP brojač do 10.
    for (let i = 0; i < 7; i++) await service.forgotPassword({ email: `m${i}@y.com` }, "1.1.1.1");
    await expectRateLimited(service.forgotPassword({ email: "zz@y.com" }, "1.1.1.1"), 60);
  });

  it("resendVerification: 4. slanje po mejlu u satu je odbijeno", async () => {
    const service = createAuthService({ repo: authRepo, email, clock, rateLimiter: memoryLimiter() });
    for (let i = 0; i < 3; i++) await service.resendVerification("u1", "2.2.2.2");
    await expectRateLimited(service.resendVerification("u1", "2.2.2.2"), 60);
  });

  it("createReport: 11. prijava u danu je odbijena", async () => {
    const repo = { createReport: vi.fn().mockResolvedValue({ id: "r" }) } as unknown as SafetyRepository;
    const service = createSafetyService({ repo, clock, email: { send: vi.fn() }, rateLimiter: memoryLimiter() });
    const input = { reportedId: "x", reason: "SPAM" } as unknown as Parameters<typeof service.createReport>[1];
    for (let i = 0; i < 10; i++) await service.createReport("u1", input);
    await expectRateLimited(service.createReport("u1", input), 1440);
    expect(repo.createReport).toHaveBeenCalledTimes(10);
  });

  it("sendMessage: 31. poruka u minuti je odbijena, a član se provjerava prije limita", async () => {
    const repo = {
      isMember: vi.fn().mockResolvedValue(true),
      createMessage: vi.fn().mockResolvedValue({ id: 1n, matchId: "m", senderId: "u1", body: "x", createdAt: clock.now() }),
    } as unknown as ChatRepository;
    const service = createChatService({ repo, clock, rateLimiter: memoryLimiter() });
    for (let i = 0; i < 30; i++) await service.sendMessage("u1", "m", "x");
    await expectRateLimited(service.sendMessage("u1", "m", "x"), 1);
    expect(repo.createMessage).toHaveBeenCalledTimes(30);
  });
});
