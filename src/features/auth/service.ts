import { Prisma } from "@/generated/prisma/client";
import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateAuthToken, hashAuthToken } from "@/lib/auth/tokens";
import { signSessionToken } from "@/lib/auth/jwt";
import { isAdminEmail } from "@/lib/auth/isAdminEmail";
import type { EmailProvider } from "@/lib/email";
import { sr } from "@/content/sr";
import type { AuthRepository } from "./repository";
import { toMe } from "./mappers";

export interface AuthServiceDeps {
  repo: AuthRepository;
  email: EmailProvider;
  clock: Clock;
}

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h — nije navedeno u api.md, pretpostavka
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — nije navedeno u api.md, pretpostavka
const RESEND_COOLDOWN_MS = 60 * 1000; // api.md: 429 ako je prethodni mail mlađi od 60s

export function createAuthService(deps: AuthServiceDeps) {
  const { repo, email, clock } = deps;

  async function sendVerificationEmail(userId: string, userEmail: string) {
    const { raw, hash } = generateAuthToken();
    const expiresAt = new Date(clock.now().getTime() + VERIFICATION_TOKEN_TTL_MS);
    await repo.createAuthToken({ userId, type: "EMAIL_VERIFICATION", tokenHash: hash, expiresAt });
    const link = `${process.env.APP_URL}/potvrda-emaila?token=${raw}`;
    await email.send({
      to: userEmail,
      subject: sr.auth.emails.verification.subject,
      text: sr.auth.emails.verification.body(link),
    });
  }

  return {
    async register(input: { email: string; password: string }) {
      const passwordHash = await hashPassword(input.password);
      let created: { id: string; email: string };
      try {
        created = await repo.createUserWithProfile({ email: input.email, passwordHash });
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

    async login(input: { email: string; password: string }) {
      const user = await repo.findUserByEmail(input.email);
      if (!user || user.deactivatedAt || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new ApiError("INVALID_CREDENTIALS", sr.auth.errors.invalidCredentials);
      }
      const sessionToken = await signSessionToken({ sub: user.id, tv: user.tokenVersion });
      const meRecord = await repo.findMeById(user.id);
      const me = toMe(meRecord!, isAdminEmail(user.email));
      return { me, sessionToken };
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
      await email.send({
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

    async acceptAgreement(userId: string) {
      await repo.acceptAgreement(userId, clock.now());
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
