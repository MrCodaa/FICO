// Dok admin ne odobri profil, korisnik u aplikaciji vidi samo Uredi profil
// (i informativne stranice iz footera). Sve ostalo je zaključano.
import { OPEN_ACCESS } from "@/lib/devAccess";

const OPEN_BEFORE_APPROVAL = ["/app/profile", "/app/faq", "/app/help", "/app/privacy", "/app/about"];

export function isAppUnlocked(profileStatus: string | undefined): boolean {
  return OPEN_ACCESS || profileStatus === "APPROVED";
}

export function isOpenBeforeApproval(pathname: string): boolean {
  return OPEN_BEFORE_APPROVAL.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
