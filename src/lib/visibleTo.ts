import type { Prisma } from "@/generated/prisma/client";

// Zajedničko pravilo (CLAUDE.md): odobren profil, aktivan nalog, nije viewerId,
// nema blokade ni u jednom smjeru. Koriste Discover, /api/profiles/:userId,
// liste zahtjeva i matchevi.
export function visibleTo(viewerId: string): Prisma.ProfileWhereInput {
  return {
    status: "APPROVED",
    userId: { not: viewerId },
    user: {
      deactivatedAt: null,
      blocks: { none: { blockedId: viewerId } },
      blockedBy: { none: { blockerId: viewerId } },
    },
  };
}
