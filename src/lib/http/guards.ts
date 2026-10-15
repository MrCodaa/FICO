// Guardovi iz docs/api.md. Svaki guard je nezavisna provjera; dodavanje nove ne
// mijenja withRoute.ts. Implementacije (auth, verified, onboarded, approved, admin)
// dolaze u Fazi 2, kad postoji sesija.
import type { NextRequest } from "next/server";

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
  auth: pending("auth"),
  verified: pending("verified"),
  onboarded: pending("onboarded"),
  approved: pending("approved"),
  admin: pending("admin"),
};
