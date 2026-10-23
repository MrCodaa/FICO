import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { Clock } from "@/lib/clock";
import type { EmailProvider } from "@/lib/email";
import { createAuthService } from "./service";
import { registerSchema } from "./schemas";
import type { AuthMeRecord, AuthRepository, AuthUserRecord } from "./repository";

// vitest ne učitava .env automatski — jwt.ts čita JWT_SECRET samo kad se token potpisuje.
process.env.JWT_SECRET ??= "test-secret-for-vitest";

const NOW = new Date("2026-01-01T00:00:00Z");

const REGISTER_INPUT = {
  firstName: "Ana",
  lastName: "Anić",
  email: "a@b.com",
  password: "password1",
  linkedinUrl: "https://www.linkedin.com/in/ana-anic" as string | null,
  noLinkedin: false,
};

const domainOk = vi.fn().mockResolvedValue(true);

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
    acceptAgreement: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    clearEmailBlock: vi.fn().mockResolvedValue(undefined),
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
    const service = createAuthService({ repo, email, clock: createFakeClock(), emailDomainExists: domainOk });

    const result = await service.register(REGISTER_INPUT);

    expect(result.me).toMatchObject({ id: "user-1", email: "a@b.com", emailVerified: false, profileStatus: "DRAFT" });
    expect(result.sessionToken).toBeTypeOf("string");
    expect(callOrder).toEqual(["createUserWithProfile", "email.send"]);
  });

  it("baca EMAIL_TAKEN kad repo baci P2002", async () => {
    const repo = createFakeRepo({
      createUserWithProfile: vi.fn().mockRejectedValue(knownRequestError("P2002")),
    });
    const email = createFakeEmail();
    const service = createAuthService({ repo, email, clock: createFakeClock(), emailDomainExists: domainOk });

    await expect(service.register(REGISTER_INPUT)).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("createAuthService.register (profil i domen)", () => {
  it("upisuje ime, prezime i LinkedIn u profil", async () => {
    const repo = createFakeRepo();
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock(), emailDomainExists: domainOk });

    await service.register(REGISTER_INPUT);

    expect(repo.createUserWithProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@b.com",
        firstName: "Ana",
        lastName: "Anić",
        linkedinUrl: "https://www.linkedin.com/in/ana-anic",
        noLinkedin: false,
      }),
    );
  });

  it("odbija email čiji domen ne postoji, u formatu 'Greška: ...', bez kreiranja naloga i maila", async () => {
    const repo = createFakeRepo();
    const email = createFakeEmail();
    const service = createAuthService({
      repo,
      email,
      clock: createFakeClock(),
      emailDomainExists: vi.fn().mockResolvedValue(false),
    });

    const err = await service.register(REGISTER_INPUT).catch((e: unknown) => e);

    expect(err).toMatchObject({ code: "VALIDATION_ERROR" });
    expect((err as { fields: Record<string, string> }).fields.email).toMatch(/^Greška: /);
    expect(repo.createUserWithProfile).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("registerSchema", () => {
  it("traži LinkedIn link ili 'Nemam LinkedIn'", () => {
    const base = { ...REGISTER_INPUT, linkedinUrl: "" };
    expect(registerSchema.safeParse(base).success).toBe(false);
    const withoutLinkedin = registerSchema.safeParse({ ...base, noLinkedin: true });
    expect(withoutLinkedin.success).toBe(true);
    expect(withoutLinkedin.success && withoutLinkedin.data.linkedinUrl).toBeNull();
  });

  it("odbija link koji nije LinkedIn i prazno ime", () => {
    expect(registerSchema.safeParse({ ...REGISTER_INPUT, linkedinUrl: "https://example.com/in/x" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...REGISTER_INPUT, firstName: "  " }).success).toBe(false);
  });
});

describe("createAuthService.login", () => {
  it("ne pravi nalog za nepostojeći email, već baca INVALID_CREDENTIALS", async () => {
    const repo = createFakeRepo({ findUserByEmail: vi.fn().mockResolvedValue(null) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await expect(service.login({ email: "novi@b.com", password: "bilo-sta" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect(repo.createUserWithProfile).not.toHaveBeenCalled();
  });

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

describe("createAuthService.me", () => {
  it("nepotvrđen email i neprihvaćena pravila se ne prikazuju kao gotovi", async () => {
    const repo = createFakeRepo({
      findMeById: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "a@b.com",
        emailVerifiedAt: null,
        agreementAcceptedAt: null,
        profileStatus: "DRAFT",
      } satisfies AuthMeRecord),
    });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    expect(await service.me("user-1")).toMatchObject({ emailVerified: false, agreementAccepted: false });
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

describe("createAuthService.resetPassword (uspjeh)", () => {
  it("troši token i postavlja novi hash (repo povećava tokenVersion)", async () => {
    const repo = createFakeRepo({
      findValidAuthToken: vi.fn().mockResolvedValue({ id: "token-1", userId: "user-1" }),
    });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await service.resetPassword({ token: "good", password: "novaLozinka1" });

    expect(repo.consumeAuthTokenAndResetPassword).toHaveBeenCalledWith(
      "token-1",
      "user-1",
      expect.stringMatching(/^\$2[aby]\$/),
      NOW,
    );
  });
});

describe("createAuthService.acceptAgreement", () => {
  it("poziva repo.acceptAgreement sa trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });

    await service.acceptAgreement("user-1");

    expect(repo.acceptAgreement).toHaveBeenCalledWith("user-1", NOW);
  });
});

describe("deleteAccount", () => {
  const me = { id: "user-1", email: "ana@fico.test", emailVerifiedAt: NOW, agreementAcceptedAt: NOW, profileStatus: "APPROVED" as const };

  it("briše nalog kad se upisani email poklapa (bez obzira na velika slova)", async () => {
    const repo = createFakeRepo({ findMeById: vi.fn().mockResolvedValue(me) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });
    await service.deleteAccount("user-1", " Ana@FICO.test ");
    expect(repo.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("odbija pogrešan email i ne briše ništa", async () => {
    const repo = createFakeRepo({ findMeById: vi.fn().mockResolvedValue(me) });
    const service = createAuthService({ repo, email: createFakeEmail(), clock: createFakeClock() });
    await expect(service.deleteAccount("user-1", "drugi@fico.test")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(repo.deleteUser).not.toHaveBeenCalled();
  });
});
