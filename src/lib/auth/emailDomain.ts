// Provjera da domen emaila uopšte postoji (MX zapis, a ako ga nema A/AAAA zapis).
// Samo "domen ne postoji" (ENOTFOUND / ENODATA) je odbijanje. Mrežni problemi
// i timeout se ne računaju kao greška korisnika, pa registracija prolazi.
import { resolveMx, resolve4, resolve6 } from "node:dns/promises";

export type EmailDomainChecker = (domain: string) => Promise<boolean>;

const MISSING_CODES = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

function isMissing(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return typeof code === "string" && MISSING_CODES.has(code);
}

export const emailDomainExists: EmailDomainChecker = async (domain) => {
  try {
    const mx = await resolveMx(domain);
    if (mx.length > 0) return true;
  } catch (err) {
    if (!isMissing(err)) return true;
  }
  try {
    const a = await resolve4(domain);
    if (a.length > 0) return true;
  } catch (err) {
    if (!isMissing(err)) return true;
  }
  try {
    const aaaa = await resolve6(domain);
    return aaaa.length > 0;
  } catch (err) {
    return !isMissing(err);
  }
};
