import { db } from "@/lib/db";

// Zajednička provjera blokade u bilo kom smjeru između dva korisnika.
// Koriste visibleTo() (ugrađeno u Prisma where) i chat/repository.ts (ovdje,
// za dva poznata ID-a van konteksta liste profila).
export async function areBlocked(userAId: string, userBId: string): Promise<boolean> {
  const block = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
    select: { blockerId: true },
  });
  return block !== null;
}
