export interface MeState {
  emailVerified: boolean;
  agreementAccepted: boolean;
  profileStatus: string;
}

// Jedno mjesto koje odlučuje gdje ulogovan korisnik treba da ide dalje,
// na osnovu stanja iz Me odgovora (/api/auth/login, /api/auth/register,
// /api/me) — koriste ga prijava, registracija, potvrda emaila i pravila
// platforme, da se niko ne vrati na landing stranicu i izgubi tok.
export function getNextRoute(me: MeState): string {
  if (!me.emailVerified) return "/potvrda-emaila";
  if (!me.agreementAccepted) return "/pravila";
  if (me.profileStatus === "APPROVED") return "/app";
  // Nacrt ide na profil; poslat ili odbijen profil na Kontrolnu tablu (status pregleda).
  if (me.profileStatus === "DRAFT") return "/app/profile";
  return "/app";
}
