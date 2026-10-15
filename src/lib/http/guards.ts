// Guardovi iz docs/api.md. Svaki guard je nezavisna provjera; dodavanje nove ne
// mijenja withRoute.ts. Implementacije (auth, verified, onboarded, approved, admin)
// dolaze u Fazi 2, kad postoji sesija.
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { getSessionPayload } from "@/lib/auth/session";

export type GuardName = "public" | "auth" | "verified" | "onboarded" | "approved" | "admin";

export interface GuardContext {
  userId?: string;
}

export type Guard = (req: NextRequest) => Promise<GuardContext>;

function pending(name: GuardName): Guard {
  return async () => {
    throw new Error(`Guard "${name}" nije implementiran (dolazi u Fazi 2).`);
  };
}

export const guards: Record<GuardName, Guard> = {
  public: async () => ({}),
  auth: async (req) => {
    const payload = await getSessionPayload(req);
    if (!payload) throw new ApiError("UNAUTHENTICATED", "Niste prijavljeni.");
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, deactivatedAt: true },
    });
    if (!user || user.tokenVersion !== payload.tv || user.deactivatedAt) {
      throw new ApiError("UNAUTHENTICATED", "Sesija je istekla.");
    }
    return { userId: payload.sub };
  },
  verified: pending("verified"),
  onboarded: pending("onboarded"),
  approved: pending("approved"),
  admin: pending("admin"),
};
