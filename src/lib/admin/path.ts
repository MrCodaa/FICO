// Javna adresa admin panela i pomoćne funkcije (čiste, bez I/O, sigurne i za klijenta).
// Admin panel NE živi na predvidljivoj adresi: stvarni put dolazi iz env varijable
// ADMIN_PATH, a interni folder (`INTERNAL_ADMIN_PREFIX`) je dostupan samo kroz rewrite u proxy.ts.

/** Interni App Router folder (src/app/sys-panel). Direktan pristup uvijek daje 404. */
export const INTERNAL_ADMIN_PREFIX = "/sys-panel";
/** Interni API prefiks (src/app/api/admin). Javno je dostupan samo kroz ADMIN_PATH + "/api". */
export const INTERNAL_ADMIN_API_PREFIX = "/api/admin";
/** Zadana adresa u razvoju kada ADMIN_PATH nije postavljen. */
export const DEV_ADMIN_PATH = "/upravljanje";

const ADMIN_PATH_PATTERN = /^\/[a-z0-9-]{1,59}$/;

// Prvi segmenti koji već pripadaju aplikaciji; ADMIN_PATH ih ne smije zauzeti.
const RESERVED_SEGMENTS = new Set([
  "admin",
  "api",
  "app",
  "dev",
  "faq",
  "o-nama",
  "pomoc",
  "potvrda-emaila",
  "pravila",
  "prijava",
  "privatnost",
  "registracija",
  "reset-lozinke",
  "uslovi",
  "zaboravljena-lozinka",
  INTERNAL_ADMIN_PREFIX.slice(1),
]);

export function isValidAdminPath(value: string): boolean {
  return ADMIN_PATH_PATTERN.test(value) && !RESERVED_SEGMENTS.has(value.slice(1));
}

/**
 * Vraća ispravan ADMIN_PATH ili `null` (admin ugašen). Nevažeća vrijednost se
 * tretira kao nepostavljena. Bez vrijednosti: razvoj → DEV_ADMIN_PATH, ostalo → null.
 */
export function parseAdminPath(raw: string | undefined, nodeEnv: string | undefined): string | null {
  const value = raw?.trim();
  if (value) return isValidAdminPath(value) ? value : null;
  return nodeEnv === "development" ? DEV_ADMIN_PATH : null;
}

/** Link na stranicu panela: adminHref("/x", "/prijave") → "/x/prijave". */
export function adminHref(adminPath: string, sub = ""): string {
  return `${adminPath}${sub}`;
}

/** Javni put admin API-ja: adminApi("/x", "/profiles") → "/x/api/profiles". */
export function adminApi(adminPath: string, sub = ""): string {
  return `${adminPath}/api${sub}`;
}
