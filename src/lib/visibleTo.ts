import type { Prisma } from "@/generated/prisma/client";

// Zajedničko pravilo (CLAUDE.md): odobren profil, aktivan nalog, nije viewerId,
// nema blokade ni u jednom smjeru. Koriste Discover, /api/profiles/:userId i
// Pregledani. Liste zahtjeva/matcheva (koje prikazuju i prošlu istoriju, ne
// samo trenutno vidljive kandidate) umjesto ovoga koriste lokalnu provjeru
// blokade preko @/lib/isBlocked (ista pravila, ali bez APPROVED/deactivated
// filtera koji istoriji ne odgovaraju).
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
