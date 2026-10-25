// Zaštita za seed skripte: seed briše i pravi naloge, pa smije raditi samo nad lokalnom bazom,
// ili nad bazom koju je korisnik izričito dozvolio sa ALLOW_SEED=true (npr. dev Neon branch).
// Nijedan host nije hardkodiran. Pod NODE_ENV=production seed se odbija uvijek.

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Baca grešku (na našem jeziku) ako seed ne smije raditi sa ovim okruženjem. */
export function assertSeedAllowed(env: Env = process.env): void {
  if (env.NODE_ENV === "production") {
    throw new Error("Seed je odbijen: NODE_ENV=production. Seed se nikad ne pokreće na produkciji.");
  }
  const urls = [env.DATABASE_URL, env.DIRECT_URL].filter((u): u is string => Boolean(u && u.trim()));
  if (urls.length === 0) {
    throw new Error("Seed je odbijen: DATABASE_URL nije postavljen.");
  }
  const hosts = urls.map(hostOf);
  if (hosts.some((h) => h === null)) {
    throw new Error("Seed je odbijen: DATABASE_URL/DIRECT_URL nije ispravan URL.");
  }
  const allLocal = hosts.every((h) => LOCAL_HOSTS.has(h as string));
  if (allLocal) return;
  if (env.ALLOW_SEED === "true") return;
  throw new Error(
    "Seed je odbijen: baza nije lokalna. Za dev bazu na udaljenom hostu privremeno postavi ALLOW_SEED=true " +
      "u komandi (vidi docs/testiranje.md). Nikad nad produkcijskom bazom.",
  );
}
