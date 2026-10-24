// Dok admin ne odobri profil, korisnik u aplikaciji vidi samo Kontrolnu tablu (sa statusom
// pregleda), Uredi profil i informativne stranice iz footera. Sve ostalo je zaključano.
const OPEN_BEFORE_APPROVAL = ["/app/profile", "/app/faq", "/app/help", "/app/privacy", "/app/about"];

export function isAppUnlocked(profileStatus: string | undefined): boolean {
  return profileStatus === "APPROVED";
}

export function isOpenBeforeApproval(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/app") return true; // samo tačno Kontrolna tabla, ne i podstranice
  return OPEN_BEFORE_APPROVAL.some((p) => path === p || path.startsWith(`${p}/`));
}
