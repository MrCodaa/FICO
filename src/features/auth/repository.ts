import { db } from "@/lib/db";
import { ATTEMPT_RETENTION_MS, emailAttemptKey } from "./lockout";
import type { ProfileStatus, TokenType } from "@/generated/prisma/client";

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  tokenVersion: number;
  deactivatedAt: Date | null;
}

export interface LoginAttemptRecord {
  key: string;
  failedCount: number;
  lockedUntil: Date | null;
}

export interface AuthMeRecord {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  agreementAcceptedAt: Date | null;
  emailBlockedAt?: Date | null;
  profileStatus: ProfileStatus;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findMeById(userId: string): Promise<AuthMeRecord | null>;
  createUserWithProfile(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    linkedinUrl: string | null;
    noLinkedin: boolean;
  }): Promise<{ id: string; email: string }>;
  createAuthToken(input: { userId: string; type: TokenType; tokenHash: string; expiresAt: Date }): Promise<void>;
  findValidAuthToken(tokenHash: string, type: TokenType, now: Date): Promise<{ id: string; userId: string } | null>;
  findLatestAuthToken(userId: string, type: TokenType): Promise<{ createdAt: Date } | null>;
  consumeAuthTokenAndVerifyEmail(tokenId: string, userId: string, now: Date): Promise<boolean>;
  consumeAuthTokenAndResetPassword(
    tokenId: string,
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<boolean>;
  acceptAgreement(userId: string, now: Date): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  clearEmailBlock(userId: string): Promise<void>;
  findLoginAttempts(keys: string[]): Promise<LoginAttemptRecord[]>;
  /** Atomski ++ brojača (upsert); kad dosegne `max`, upisuje lockedUntil. Vraća novi brojač. */
  registerFailedAttempt(key: string, max: number, lockedUntil: Date, now: Date): Promise<number>;
  clearLoginAttempt(key: string): Promise<void>;
}

export const authRepository: AuthRepository = {
  async findUserByEmail(email) {
    return db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        tokenVersion: true,
        deactivatedAt: true,
      },
    });
  },

  async findMeById(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        agreementAcceptedAt: true,
        emailBlockedAt: true,
        profile: { select: { status: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      agreementAcceptedAt: user.agreementAcceptedAt,
      emailBlockedAt: user.emailBlockedAt,
      profileStatus: user.profile?.status ?? "DRAFT",
    };
  },

  async createUserWithProfile({ email, passwordHash, firstName, lastName, linkedinUrl, noLinkedin }) {
    return db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      await tx.profile.create({ data: { userId: user.id, firstName, lastName, linkedinUrl, noLinkedin } });
      await tx.preference.create({ data: { userId: user.id } });
      return { id: user.id, email: user.email };
    });
  },

  async createAuthToken({ userId, type, tokenHash, expiresAt }) {
    await db.authToken.create({ data: { userId, type, tokenHash, expiresAt } });
  },

  async findValidAuthToken(tokenHash, type, now) {
    return db.authToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true },
    });
  },

  async findLatestAuthToken(userId, type) {
    return db.authToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
  },

  async consumeAuthTokenAndVerifyEmail(tokenId, userId, now) {
    return db.$transaction(async (tx) => {
      const result = await tx.authToken.updateMany({ where: { id: tokenId, usedAt: null }, data: { usedAt: now } });
      if (result.count === 0) return false;
      await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: now } });
      return true;
    });
  },

  async consumeAuthTokenAndResetPassword(tokenId, userId, passwordHash, now) {
    return db.$transaction(async (tx) => {
      const result = await tx.authToken.updateMany({ where: { id: tokenId, usedAt: null }, data: { usedAt: now } });
      if (result.count === 0) return false;
      const { email } = await tx.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
        select: { email: true },
      });
      await tx.loginAttempt.deleteMany({ where: { key: emailAttemptKey(email) } });
      return true;
    });
  },

  async acceptAgreement(userId, now) {
    await db.user.update({ where: { id: userId }, data: { agreementAcceptedAt: now } });
  },

  async clearEmailBlock(userId) {
    await db.user.update({ where: { id: userId }, data: { emailBlockedAt: null, emailBlockReason: null } });
  },

  async findLoginAttempts(keys) {
    return db.loginAttempt.findMany({
      where: { key: { in: keys } },
      select: { key: true, failedCount: true, lockedUntil: true },
    });
  },

  async registerFailedAttempt(key, max, lockedUntil, now) {
    // Increment je atomski u bazi (upsert, bez čitaj-pa-piši); zaključavanje je idempotentno.
    const { failedCount } = await db.loginAttempt.upsert({
      where: { key },
      create: { key, failedCount: 1 },
      update: { failedCount: { increment: 1 } },
      select: { failedCount: true },
    });
    if (failedCount >= max) {
      await db.loginAttempt.update({ where: { key }, data: { lockedUntil } });
    }
    // Oportunistično čišćenje starih redova (bez crona).
    await db.loginAttempt.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - ATTEMPT_RETENTION_MS) } } });
    return failedCount;
  },

  async clearLoginAttempt(key) {
    await db.loginAttempt.deleteMany({ where: { key } });
  },

  async deleteUser(userId) {
    // Sve ostalo (profil, preference, odluke, zahtjevi, matchevi, poruke…) ide kaskadno.
    await db.user.delete({ where: { id: userId } });
  },
};

