import { Prisma } from "@/generated/prisma/client";
import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateAuthToken, hashAuthToken } from "@/lib/auth/tokens";
import { signSessionToken } from "@/lib/auth/jwt";
import { isAdminEmail } from "@/lib/auth/isAdminEmail";
import { emailDomainExists, type EmailDomainChecker } from "@/lib/auth/emailDomain";
import type { EmailProvider } from "@/lib/email";
import { sr } from "@/content/sr";
import type { AuthRepository } from "./repository";
import { toMe } from "./mappers";
import {
  LOCKOUT_MS,
  MAX_FAILED_PER_EMAIL,
  MAX_FAILED_PER_IP,
  emailAttemptKey,
  ipAttemptKey,
} from "./lockout";
import type { RegisterInput } from "./schemas";

export interface AuthServiceDeps {
  repo: AuthRepository;
  email: EmailProvider;
  clock: Clock;
  /** Provjera da domen emaila postoji (u testovima se zamjenjuje fake-om). */
  emailDomainExists?: EmailDomainChecker;
}

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h — nije navedeno u api.md, pretpostavka
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — nije navedeno u api.md, pretpostavka
const RESEND_COOLDOWN_MS = 60 * 1000; // api.md: 429 ako je prethodni mail mlađi od 60s

let dummyHashPromise: Promise<string> | undefined;
/** Bcrypt hash (cost 12) za lažnu provjeru kad nalog ne postoji. */
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("fico-dummy-password");
  return dummyHashPromise;
}

export function createAuthService(deps: AuthServiceDeps) {
  const { repo, email, clock } = deps;
  const domainExists = deps.emailDomainExists ?? emailDomainExists;

  // Mail je sporedan efekat poslije uspješne transakcije — ako provider
  // zakaže (loš API ključ, mreža), ne smije oboriti operaciju koja je već
  // commitovana (nalog je kreiran, token postoji). Korisnik može zatražiti
  // ponovno slanje preko resendVerification/forgotPassword.
  async function trySendEmail(message: Parameters<EmailProvider["send"]>[0]) {
    try {
      await email.send(message);
    } catch (err) {
      console.error("[auth] slanje maila nije uspjelo:", err);
    }
  }

  async function sendVerificationEmail(userId: string, userEmail: string) {
    const { raw, hash } = generateAuthToken();
    const expiresAt = new Date(clock.now().getTime() + VERIFICATION_TOKEN_TTL_MS);
    await repo.createAuthToken({ userId, type: "EMAIL_VERIFICATION", tokenHash: hash, expiresAt });
    const link = `${process.env.APP_URL}/potvrda-emaila?token=${raw}`;
    await trySendEmail({
      to: userEmail,
      subject: sr.auth.emails.verification.subject,
      text: sr.auth.emails.verification.body(link),
    });
  }

  return {
    async register(input: RegisterInput) {
      const domain = input.email.split("@")[1] ?? "";
      if (!(await domainExists(domain))) {
        throw new ApiError("VALIDATION_ERROR", sr.auth.errors.emailDomainMissing, {
          email: sr.auth.errors.emailDomainMissing,
        });
      }
      const passwordHash = await hashPassword(input.password);
      let created: { id: string; email: string };
      try {
        created = await repo.createUserWithProfile({
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          linkedinUrl: input.linkedinUrl,
          noLinkedin: input.noLinkedin,
        });
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          throw new ApiError("EMAIL_TAKEN", sr.auth.errors.emailTaken);
        }
        throw err;
      }
      // Mail ide tek poslije uspješnog kreiranja usera, da rollback nikad ne pošalje mail.
      await sendVerificationEmail(created.id, created.email);
      const sessionToken = await signSessionToken({ sub: created.id, tv: 0 });
      const me = toMe(
        { id: created.id, email: created.email, emailVerifiedAt: null, agreementAcceptedAt: null, profileStatus: "DRAFT" },
        isAdminEmail(created.email),
      );
      return { me, sessionToken };
    },

    async login(input: { email: string; password: string }, ip: string) {
      const now = clock.now();
      const emailKey = emailAttemptKey(input.email);
      const ipKey = ipAttemptKey(ip);

      // Brojači ne zavise od postojanja naloga: isto ponašanje i poruka za oba slučaja.
      const attempts = await repo.findLoginAttempts([emailKey, ipKey]);
      let longestLockMs = 0;
      for (const attempt of attempts) {
        if (!attempt.lockedUntil) continue;
        const left = attempt.lockedUntil.getTime() - now.getTime();
        if (left > 0) longestLockMs = Math.max(longestLockMs, left);
        else await repo.clearLoginAttempt(attempt.key); // zaključavanje isteklo: brojanje kreće ispočetka
      }
      if (longestLockMs > 0) {
        throw new ApiError("TOO_MANY_REQUESTS", sr.auth.errors.loginLocked(Math.ceil(longestLockMs / 60000)));
      }

      const user = await repo.findUserByEmail(input.email);
      // Za nepostojeći nalog radi se lažna bcrypt provjera da vrijeme odgovora bude slično.
      const passwordOk = await verifyPassword(input.password, user ? user.passwordHash : await dummyHash());
      if (!user || user.deactivatedAt || !passwordOk) {
        const lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
        await repo.registerFailedAttempt(emailKey, MAX_FAILED_PER_EMAIL, lockedUntil, now);
        await repo.registerFailedAttempt(ipKey, MAX_FAILED_PER_IP, lockedUntil, now);
        throw new ApiError("INVALID_CREDENTIALS", sr.auth.errors.invalidCredentials);
      }
      await repo.clearLoginAttempt(emailKey);
      const sessionToken = await signSessionToken({ sub: user.id, tv: user.tokenVersion });
      const meRecord = await repo.findMeById(user.id);
      const me = toMe(meRecord!, isAdminEmail(user.email));
      return { me, sessionToken, tokenVersion: user.tokenVersion };
    },

    async verifyEmail(input: { token: string }) {
      const hash = hashAuthToken(input.token);
      const now = clock.now();
      const record = await repo.findValidAuthToken(hash, "EMAIL_VERIFICATION", now);
      if (!record) throw new ApiError("TOKEN_INVALID", sr.auth.errors.tokenInvalid);
      const ok = await repo.consumeAuthTokenAndVerifyEmail(record.id, record.userId, now);
      if (!ok) throw new ApiError("TOKEN_INVALID", sr.auth.errors.tokenInvalid);
    },

    async resendVerification(userId: string) {
      const user = await repo.findMeById(userId);
      if (!user || user.emailVerifiedAt) return;
      const latest = await repo.findLatestAuthToken(userId, "EMAIL_VERIFICATION");
      const now = clock.now();
      if (latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
        throw new ApiError("TOO_MANY_REQUESTS", sr.auth.errors.tooManyRequests);
      }
      await sendVerificationEmail(userId, user.email);
    },

    async forgotPassword(input: { email: string }) {
      const user = await repo.findUserByEmail(input.email);
      // Tiho se vraća i kad nalog ne postoji ili je deaktiviran — api.md: 204 uvijek, bez otkrivanja postojanja.
      if (!user || user.deactivatedAt) return;
      const { raw, hash } = generateAuthToken();
      const expiresAt = new Date(clock.now().getTime() + RESET_TOKEN_TTL_MS);
      await repo.createAuthToken({ userId: user.id, type: "PASSWORD_RESET", tokenHash: hash, expiresAt });
      const link = `${process.env.APP_URL}/reset-lozinke?token=${raw}`;
      await trySendEmail({
        to: user.email,
        subject: sr.auth.emails.passwordReset.subject,
        text: sr.auth.emails.passwordReset.body(link),
      });
    },

    async resetPassword(input: { token: string; password: string }) {
      const hash = hashAuthToken(input.token);
      const now = clock.now();
      const record = await repo.findValidAuthToken(hash, "PASSWORD_RESET", now);
      if (!record) throw new ApiError("TOKEN_INVALID", sr.auth.errors.tokenInvalid);
      const passwordHash = await hashPassword(input.password);
      const ok = await repo.consumeAuthTokenAndResetPassword(record.id, record.userId, passwordHash, now);
      if (!ok) throw new ApiError("TOKEN_INVALID", sr.auth.errors.tokenInvalid);
    },

    async me(userId: string) {
      const user = await repo.findMeById(userId);
      if (!user) throw new ApiError("NOT_FOUND", "Korisnik ne postoji.");
      return toMe(user, isAdminEmail(user.email));
    },

    /** Kontrolna tabla → "Odblokiraj": skida blacklist adresu i šalje novi mejl za potvrdu. */
    async unblockEmail(userId: string) {
      const user = await repo.findMeById(userId);
      if (!user) throw new ApiError("NOT_FOUND", "Korisnik ne postoji.");
      if (!user.emailBlockedAt) return;
      await repo.clearEmailBlock(userId);
      await sendVerificationEmail(userId, user.email);
    },

    async acceptAgreement(userId: string) {
      await repo.acceptAgreement(userId, clock.now());
    },

    /** Podešavanja → "Obriši nalog": potvrda je upisan email naloga. */
    async deleteAccount(userId: string, confirmEmail: string) {
      const user = await repo.findMeById(userId);
      if (!user) throw new ApiError("NOT_FOUND", "Korisnik ne postoji.");
      if (user.email !== confirmEmail.trim().toLowerCase()) {
        throw new ApiError("VALIDATION_ERROR", "Email se ne poklapa.", { email: "Email se ne poklapa." });
      }
      await repo.deleteUser(userId);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
