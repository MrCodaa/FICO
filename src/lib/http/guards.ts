// Guardovi iz docs/api.md. Svaki guard je nezavisna provjera; dodavanje nove ne
// mijenja withRoute.ts. Implementacije (auth, verified, onboarded, approved, admin)
// dolaze u Fazi 2, kad postoji sesija.
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { getSessionPayload } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/isAdminEmail";

export type GuardName = "public" | "auth" | "verified" | "onboarded" | "approved" | "admin";

export interface GuardContext {
  userId?: string;
}

export type Guard = (req: NextRequest) => Promise<GuardContext>;

function pending(name: GuardName): Guard {
  return async () => {
    throw new Error(`Guard "${name}" nije implementiran (dolazi u kasnijoj fazi).`);
  };
}

async function requireSessionUser(req: NextRequest) {
  const payload = await getSessionPayload(req);
  if (!payload) throw new ApiError("UNAUTHENTICATED", "Niste prijavljeni.");
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { email: true, tokenVersion: true, deactivatedAt: true, emailVerifiedAt: true, agreementAcceptedAt: true },
  });
  if (!user || user.tokenVersion !== payload.tv || user.deactivatedAt) {
    throw new ApiError("UNAUTHENTICATED", "Sesija je istekla.");
  }
  return {
    userId: payload.sub,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    agreementAcceptedAt: user.agreementAcceptedAt,
  };
}

export const guards: Record<GuardName, Guard> = {
  public: async () => ({}),
  auth: async (req) => {
    const { userId } = await requireSessionUser(req);
    return { userId };
  },
  verified: async (req) => {
    const { userId, emailVerifiedAt } = await requireSessionUser(req);
    if (!emailVerifiedAt) throw new ApiError("EMAIL_NOT_VERIFIED", "Email nije potvrđen.");
    return { userId };
  },
  onboarded: async (req) => {
    const { userId, emailVerifiedAt, agreementAcceptedAt } = await requireSessionUser(req);
    if (!emailVerifiedAt) throw new ApiError("EMAIL_NOT_VERIFIED", "Email nije potvrđen.");
    if (!agreementAcceptedAt) throw new ApiError("AGREEMENT_REQUIRED", "Prihvati pravila platforme.");
    return { userId };
  },
  approved: pending("approved"),
  admin: async (req) => {
    const { userId, email } = await requireSessionUser(req);
    if (!isAdminEmail(email)) throw new ApiError("FORBIDDEN", "Nemaš pristup.");
    return { userId };
  },
};
