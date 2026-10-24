import bcrypt from "bcrypt";

const PRODUCTION_MIN_COST = 12;

/**
 * Jedino mjesto gdje se bira bcrypt cost. Zadano je 12. BCRYPT_COST iz okruženja
 * može ga promijeniti (testovi koriste 4), ali u produkciji se niža vrijednost
 * ignoriše. Provjera starih hasheva ne zavisi od ovoga: cost je zapisan u hashu.
 */
export function resolveBcryptCost(
  env: { NODE_ENV?: string; BCRYPT_COST?: string } = process.env,
): number {
  const raw = Number.parseInt(env.BCRYPT_COST ?? "", 10);
  const cost = Number.isInteger(raw) && raw >= 4 && raw <= 31 ? raw : PRODUCTION_MIN_COST;
  return env.NODE_ENV === "production" ? Math.max(cost, PRODUCTION_MIN_COST) : cost;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, resolveBcryptCost());
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
