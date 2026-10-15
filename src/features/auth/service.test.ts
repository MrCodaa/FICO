import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { Clock } from "@/lib/clock";
import type { EmailProvider } from "@/lib/email";
import { createAuthService } from "./service";
import type { AuthMeRecord, AuthRepository, AuthUserRecord } from "./repository";

// vitest ne učitava .env automatski — jwt.ts čita JWT_SECRET samo kad se token potpisuje.
process.env.JWT_SECRET ??= "test-secret-for-vitest";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeEmail(): EmailProvider & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

function createFakeRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    findMeById: vi.fn().mockResolvedValue(null),
    createUserWithProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "a@b.com" }),
    createAuthToken: vi.fn().mockResolvedValue(undefined),
    findValidAuthToken: vi.fn().mockResolvedValue(null),
    findLatestAuthToken: vi.fn().mockResolvedValue(null),
    consumeAuthTokenAndVerifyEmail: vi.fn().mockResolvedValue(true),
    consumeAuthTokenAndResetPassword: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code,
    clientVersion: "7.10.0",
  });
}

describe("createAuthService.register", () => {
  it("vraća me i sessionToken, i šalje mail tek nakon kreiranja usera", async () => {
    const callOrder: string[] = [];
    const repo = createFakeRepo({
      createUserWithProfile: vi.fn().mockImplementation(async () => {
        callOrder.push("createUserWithProfile");
        return { id: "user-1", email: "a@b.com" };
      }),
    });
    const email = createFakeEmail();
    email.send.mockImplementation(async () => {
      callOrder.push("email.send");
    });
    const service = createAuthService({ repo, email, clock: createFakeClock() });

    const result = await service.register({ email: "a@b.com", password: "password1" });

    expect(result.me).toMatchObject({ id: "user-1", email: "a@b.com", emailVerified: false, profileStatus: "DRAFT" });
    expect(result.sessionToken).toBeTypeOf("string");
    expect(callOrder).toEqual(["createUserWithProfile", "email.send"]);
  });

  it("baca EMAIL_TAKEN kad repo baci P2002", async () => {
    const repo = createFakeRepo({
      createUserWithProfile: vi.fn().mockRejectedValue(knownRequestError("P2002")),
    });
    const email = createFakeEmail();
    const service = createAuthService({ repo, email, clock: createFakeClock() });

    await expect(service.register({ email: "a@b.com", password: "password1" })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("createAuthService.login", () => {
  it("baca INVALID_CREDENTIALS kod pogrešne lozinke", async () => {
    const user: AuthUserRecord = {
      id: "user-1",
      email: "a@b.com",
      // bcrypt hash za "correct-password"
      passwordHash: await (await import("@/lib/auth/password")).hashPassword("correct-password"),
      tokenVersion: 0,
      deactivatedAt: null,
    };
    const repo = createFakeRepo({ findUserByEmail: vi.fn().mockResolvedValue(user) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.login({ email: "a@b.com", password: "wrong-password" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("baca INVALID_CREDENTIALS za deaktiviran nalog", async () => {
    const user: AuthUserRecord = {
      id: "user-1",
      email: "a@b.com",
      passwordHash: await (await import("@/lib/auth/password")).hashPassword("correct-password"),
      tokenVersion: 0,
      deactivatedAt: NOW,
    };
    const repo = createFakeRepo({ findUserByEmail: vi.fn().mockResolvedValue(user) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.login({ email: "a@b.com", password: "correct-password" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("vraća me i sessionToken za ispravne podatke", async () => {
    const { hashPassword } = await import("@/lib/auth/password");
    const user: AuthUserRecord = {
      id: "user-1",
      email: "a@b.com",
      passwordHash: await hashPassword("correct-password"),
      tokenVersion: 3,
      deactivatedAt: null,
    };
    const meRecord: AuthMeRecord = {
      id: "user-1",
      email: "a@b.com",
      emailVerifiedAt: NOW,
      agreementAcceptedAt: null,
      profileStatus: "DRAFT",
    };
    const repo = createFakeRepo({
      findUserByEmail: vi.fn().mockResolvedValue(user),
      findMeById: vi.fn().mockResolvedValue(meRecord),
    });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    const result = await service.login({ email: "a@b.com", password: "correct-password" });

    expect(result.me).toMatchObject({ id: "user-1", email: "a@b.com", emailVerified: true });
    expect(result.sessionToken).toBeTypeOf("string");
  });
});

describe("createAuthService.verifyEmail", () => {
  it("baca TOKEN_INVALID za nevalidan/istekao token", async () => {
    const repo = createFakeRepo({ findValidAuthToken: vi.fn().mockResolvedValue(null) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.verifyEmail({ token: "bad-token" })).rejects.toMatchObject({ code: "TOKEN_INVALID" });
  });

  it("poziva consumeAuthTokenAndVerifyEmail za validan token", async () => {
    const repo = createFakeRepo({
      findValidAuthToken: vi.fn().mockResolvedValue({ id: "token-1", userId: "user-1" }),
      consumeAuthTokenAndVerifyEmail: vi.fn().mockResolvedValue(true),
    });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await service.verifyEmail({ token: "good-token" });

    expect(repo.consumeAuthTokenAndVerifyEmail).toHaveBeenCalledWith("token-1", "user-1", NOW);
  });
});

describe("createAuthService.resendVerification", () => {
  it("baca TOO_MANY_REQUESTS ako je prošlo manje od 60s od zadnjeg slanja", async () => {
    const meRecord: AuthMeRecord = {
      id: "user-1",
      email: "a@b.com",
      emailVerifiedAt: null,
      agreementAcceptedAt: null,
      profileStatus: "DRAFT",
    };
    const repo = createFakeRepo({
      findMeById: vi.fn().mockResolvedValue(meRecord),
      findLatestAuthToken: vi.fn().mockResolvedValue({ createdAt: new Date(NOW.getTime() - 30_000) }),
    });
    const email = createFakeEmail();
    const service = createAuthService({ repo, email, clock: createFakeClock() });

    await expect(service.resendVerification("user-1")).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("createAuthService.resetPassword", () => {
  it("baca TOKEN_INVALID za nevalidan token", async () => {
    const repo = createFakeRepo({ findValidAuthToken: vi.fn().mockResolvedValue(null) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.resetPassword({ token: "bad-token", password: "password1" })).rejects.toMatchObject({
      code: "TOKEN_INVALID",
    });
  });
});
