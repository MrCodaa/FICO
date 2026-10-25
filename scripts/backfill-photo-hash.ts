// Jednokratno popunjavanje otisaka slike (photoHash, photoDHash) za profile koji su slike
// otpremili prije uvođenja provjere tuđe/ponovljene slike.
//
// Pokretanje (korisnik, na DEV bazi; skripta ČITA DATABASE_URL iz .env):
//   npm run db:backfill-photo-hash            # samo ispis šta bi se upisalo (dry run)
//   npm run db:backfill-photo-hash -- --write # upisuje otiske
//
// Ne mijenja slike ni status profila i ne postavlja oznaku za admina; samo ispisuje parove
// profila sa istom ili sličnom slikom da ih admin ručno pogleda.
// Slike: https (Vercel Blob) se preuzimaju, a /uploads/... se čitaju iz public/uploads/.

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hammingDistance, hashPhoto, SIMILAR_PHOTO_MAX_DISTANCE } from "../src/features/profile/photoHash";

const write = process.argv.includes("--write");

async function loadImage(url: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (url.startsWith("/uploads/")) {
    const root = path.resolve(process.cwd(), "public", "uploads");
    const full = path.resolve(root, url.slice("/uploads/".length));
    if (!full.startsWith(root + path.sep)) throw new Error("neispravna putanja");
    return readFile(full);
  }
  throw new Error("nepoznat oblik adrese");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL nije postavljen.");
  console.log(`Baza: ${new URL(connectionString).host} | režim: ${write ? "UPIS" : "dry run"}`);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const profiles = await db.profile.findMany({
      where: { photoUrl: { not: null }, photoHash: null },
      select: { userId: true, firstName: true, lastName: true, photoUrl: true },
    });
    console.log(`Profila bez otisaka: ${profiles.length}`);
    const done: { userId: string; name: string; sha256: string; dHash: string | null }[] = [];
    for (const p of profiles) {
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.userId;
      try {
        const hashes = await hashPhoto(await loadImage(p.photoUrl!));
        done.push({ userId: p.userId, name, ...hashes });
        if (write) {
          await db.profile.update({
            where: { userId: p.userId },
            data: { photoHash: hashes.sha256, photoDHash: hashes.dHash },
          });
        }
      } catch (err) {
        console.warn(`PRESKOČENO ${name} (${p.userId}): ${(err as Error).message}`);
      }
    }
    console.log(`Obrađeno: ${done.length}${write ? " (upisano)" : " (nije upisano, koristi --write)"}`);

    const all = write
      ? await db.profile.findMany({
          where: { photoHash: { not: null } },
          select: { userId: true, firstName: true, lastName: true, photoHash: true, photoDHash: true },
        })
      : done.map((d) => ({ userId: d.userId, firstName: d.name, lastName: null, photoHash: d.sha256, photoDHash: d.dHash }));
    const nameOf = (p: { userId: string; firstName: string | null; lastName: string | null }) =>
      [p.firstName, p.lastName].filter(Boolean).join(" ") || p.userId;
    let pairs = 0;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i]!;
        const b = all[j]!;
        const same = a.photoHash === b.photoHash;
        const similar = a.photoDHash && b.photoDHash && hammingDistance(a.photoDHash, b.photoDHash) <= SIMILAR_PHOTO_MAX_DISTANCE;
        if (same || similar) {
          pairs++;
          console.log(`${same ? "ISTA" : "SLIČNA"} slika: ${nameOf(a)} (${a.userId}) <-> ${nameOf(b)} (${b.userId})`);
        }
      }
    }
    console.log(`Parova sa istom/sličnom slikom: ${pairs}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
