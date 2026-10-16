// Guardovi iz docs/api.md. Svaki guard je nezavisna provjera; dodavanje nove ne
// mijenja withRoute.ts.
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

async function requireSessionUser(req: NextRequest) {
  const payload = await getSessionPayload(req);
  if (!payload) throw new ApiError("UNAUTHENTICATED", "Niste prijavljeni.");
  // Status profila ide u isti upit, da `approved` guard ne plaća drugi round-trip.
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      email: true,
      tokenVersion: true,
      deactivatedAt: true,
      emailVerifiedAt: true,
      agreementAcceptedAt: true,
      profile: { select: { status: true } },
    },
  });
  if (!user || user.tokenVersion !== payload.tv || user.deactivatedAt) {
    throw new ApiError("UNAUTHENTICATED", "Sesija je istekla.");
  }
  return {
    userId: payload.sub,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    agreementAcceptedAt: user.agreementAcceptedAt,
    profileStatus: user.profile?.status ?? null,
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
  approved: async (req) => {
    const { userId, emailVerifiedAt, agreementAcceptedAt, profileStatus } = await requireSessionUser(req);
    if (!emailVerifiedAt) throw new ApiError("EMAIL_NOT_VERIFIED", "Email nije potvrđen.");
    if (!agreementAcceptedAt) throw new ApiError("AGREEMENT_REQUIRED", "Prihvati pravila platforme.");
    if (profileStatus !== "APPROVED") {
      throw new ApiError("PROFILE_NOT_APPROVED", "Profil nije odobren.");
    }
    return { userId };
  },
  admin: async (req) => {
    const { userId, email } = await requireSessionUser(req);
    if (!isAdminEmail(email)) throw new ApiError("FORBIDDEN", "Nemaš pristup.");
    return { userId };
  },
};
