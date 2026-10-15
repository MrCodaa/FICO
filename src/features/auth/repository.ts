import { db } from "@/lib/db";
import type { ProfileStatus, TokenType } from "@/generated/prisma/client";

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  tokenVersion: number;
  deactivatedAt: Date | null;
}

export interface AuthMeRecord {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  agreementAcceptedAt: Date | null;
  profileStatus: ProfileStatus;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findMeById(userId: string): Promise<AuthMeRecord | null>;
  createUserWithProfile(input: { email: string; passwordHash: string }): Promise<{ id: string; email: string }>;
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
}

export const authRepository: AuthRepository = {
  async findUserByEmail(email) {
    return db.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, tokenVersion: true, deactivatedAt: true },
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
        profile: { select: { status: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      agreementAcceptedAt: user.agreementAcceptedAt,
      profileStatus: user.profile?.status ?? "DRAFT",
    };
  },

  async createUserWithProfile({ email, passwordHash }) {
    return db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      await tx.profile.create({ data: { userId: user.id } });
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
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      return true;
    });
  },
};
